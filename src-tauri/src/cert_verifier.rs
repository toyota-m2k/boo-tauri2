use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::client::WebPkiServerVerifier;
use rustls::crypto::CryptoProvider;
use rustls::pki_types::{CertificateDer, ServerName, UnixTime};
use rustls::{DigitallySignedStruct, Error as TlsError, RootCertStore, SignatureScheme};
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;

/// Fingerprint pinning store: host (lowercased) → SHA-256 hash bytes (32 bytes).
/// Frontend registers each known host once; verifier looks up by ServerName at handshake time.
#[derive(Clone, Debug, Default)]
pub struct PinningStore {
    inner: Arc<RwLock<HashMap<String, [u8; 32]>>>,
}

impl PinningStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set(&self, host: &str, fingerprint_hex: &str) -> Result<(), String> {
        let bytes = parse_fingerprint(fingerprint_hex)?;
        let mut guard = self.inner.write().map_err(|e| e.to_string())?;
        guard.insert(host.to_ascii_lowercase(), bytes);
        Ok(())
    }

    pub fn remove(&self, host: &str) -> Result<(), String> {
        let mut guard = self.inner.write().map_err(|e| e.to_string())?;
        guard.remove(&host.to_ascii_lowercase());
        Ok(())
    }

    pub fn get(&self, host: &str) -> Option<[u8; 32]> {
        let guard = self.inner.read().ok()?;
        guard.get(&host.to_ascii_lowercase()).copied()
    }
}

/// "AB:CD:EF..." (32 bytes hex with optional ':' / '-' / ' ' separators) → [u8; 32]
fn parse_fingerprint(s: &str) -> Result<[u8; 32], String> {
    let cleaned: String = s.chars().filter(|c| !matches!(c, ':' | '-' | ' ')).collect();
    if cleaned.len() != 64 {
        return Err(format!(
            "fingerprint must be 32 bytes (64 hex chars), got {}",
            cleaned.len()
        ));
    }
    let mut out = [0u8; 32];
    hex::decode_to_slice(&cleaned, &mut out).map_err(|e| e.to_string())?;
    Ok(out)
}

/// rustls の ServerCertVerifier 実装。
/// 1. PinningStore に該当ホストの fingerprint があれば SHA-256(end_entity DER) と定数時間比較
/// 2. 無ければ rustls 標準の WebPkiServerVerifier (システム CA) にフォールバック
///
/// BooDroid の CompositeTrustManager と同じ二段構え。
#[derive(Debug)]
pub struct PinningVerifier {
    pinning: PinningStore,
    inner: Arc<WebPkiServerVerifier>,
    provider: Arc<CryptoProvider>,
}

impl PinningVerifier {
    pub fn new(pinning: PinningStore) -> Result<Self, String> {
        let mut roots = RootCertStore::empty();
        // システム CA (Windows / macOS / Linux で読める。Android では何も返らない)
        for cert in rustls_native_certs::load_native_certs().certs {
            let _ = roots.add(cert);
        }
        // Mozilla CA バンドル (Android 等の system CA が読めない環境のフォールバック)。
        // rustls-native-certs と併用しても重複する CA を再登録するだけで害はない。
        roots.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());

        if roots.is_empty() {
            return Err("no trust anchors loaded (neither native nor webpki-roots)".into());
        }

        let provider = Arc::new(rustls::crypto::ring::default_provider());
        let inner =
            WebPkiServerVerifier::builder_with_provider(Arc::new(roots), provider.clone())
                .build()
                .map_err(|e| e.to_string())?;
        Ok(Self {
            pinning,
            inner,
            provider,
        })
    }

    pub fn provider(&self) -> Arc<CryptoProvider> {
        self.provider.clone()
    }

    fn check_pinned(&self, host: &str, end_entity: &CertificateDer<'_>) -> Option<bool> {
        let expected = self.pinning.get(host)?;
        let actual = Sha256::digest(end_entity.as_ref());
        Some(bool::from(expected.ct_eq(actual.as_slice())))
    }
}

impl ServerCertVerifier for PinningVerifier {
    fn verify_server_cert(
        &self,
        end_entity: &CertificateDer<'_>,
        intermediates: &[CertificateDer<'_>],
        server_name: &ServerName<'_>,
        ocsp_response: &[u8],
        now: UnixTime,
    ) -> Result<ServerCertVerified, TlsError> {
        let host = server_name_to_string(server_name);

        // 1) pinning に登録があれば fingerprint チェック (自己署名対応の核心)
        if let Some(matched) = self.check_pinned(&host, end_entity) {
            if matched {
                return Ok(ServerCertVerified::assertion());
            }
            // pinning 登録があるのに不一致 → MITM 等の疑いがあるので CA fallback もせず拒否
            return Err(TlsError::General(format!(
                "pinned fingerprint mismatch for host {}",
                host
            )));
        }

        // 2) システム CA で検証 (Let's Encrypt 等の正規証明書はここで通る)
        self.inner
            .verify_server_cert(end_entity, intermediates, server_name, ocsp_response, now)
    }

    fn verify_tls12_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, TlsError> {
        self.inner.verify_tls12_signature(message, cert, dss)
    }

    fn verify_tls13_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, TlsError> {
        self.inner.verify_tls13_signature(message, cert, dss)
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        self.inner.supported_verify_schemes()
    }
}

fn server_name_to_string(name: &ServerName<'_>) -> String {
    match name {
        ServerName::DnsName(d) => d.as_ref().to_ascii_lowercase(),
        ServerName::IpAddress(ip) => format!("{}", display_ip(ip)),
        _ => format!("{:?}", name),
    }
}

fn display_ip(ip: &rustls_pki_types::IpAddr) -> String {
    match ip {
        rustls_pki_types::IpAddr::V4(v4) => {
            let o = v4.as_ref();
            format!("{}.{}.{}.{}", o[0], o[1], o[2], o[3])
        }
        rustls_pki_types::IpAddr::V6(v6) => {
            let b = v6.as_ref();
            let segs: Vec<String> = b
                .chunks(2)
                .map(|c| format!("{:x}", ((c[0] as u16) << 8) | c[1] as u16))
                .collect();
            segs.join(":")
        }
    }
}
