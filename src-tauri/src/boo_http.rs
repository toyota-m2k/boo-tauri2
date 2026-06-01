use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use reqwest::{Client, Method};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::cert_verifier::{PinningStore, PinningVerifier};

/// 共有 reqwest::Client。fingerprint pinning verifier 付きで TLS を扱う。
/// JSON API と media proxy で同じ Client を共用する。
#[derive(Clone)]
pub struct HttpClient {
    inner: Arc<Client>,
}

impl HttpClient {
    pub fn new(pinning: PinningStore) -> Result<Self, String> {
        let verifier = PinningVerifier::new(pinning)?;
        let tls_config = rustls::ClientConfig::builder_with_provider(verifier.provider())
            .with_safe_default_protocol_versions()
            .map_err(|e| e.to_string())?
            .dangerous()
            .with_custom_certificate_verifier(Arc::new(verifier))
            .with_no_client_auth();

        let client = Client::builder()
            .use_preconfigured_tls(tls_config)
            // 自己署名証明書のサーバはホスト名検証で弾かれることがあるので無効化
            // (フィンガープリント pin が事実上のホスト識別になる)
            .danger_accept_invalid_hostnames(true)
            .build()
            .map_err(|e| e.to_string())?;

        Ok(Self {
            inner: Arc::new(client),
        })
    }

    pub fn client(&self) -> Arc<Client> {
        self.inner.clone()
    }
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequestArgs {
    pub url: String,
    pub method: Option<String>,
    pub headers: Option<HashMap<String, String>>,
    /// リクエスト本文を生バイト列で渡す場合
    pub body: Option<Vec<u8>>,
    /// リクエスト本文を文字列で渡す場合 (こちらが指定されれば優先)
    pub body_text: Option<String>,
    pub timeout_ms: Option<u32>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HttpResponse {
    pub status: u16,
    pub ok: bool,
    pub headers: HashMap<String, String>,
    /// JS 側で TextDecoder / JSON.parse する
    pub body: Vec<u8>,
}

/// 単発 HTTP リクエスト。HTTPS の場合は自作 pinning verifier 経由で検証される。
#[tauri::command]
pub async fn boo_http_request(
    args: HttpRequestArgs,
    state: State<'_, HttpClient>,
) -> Result<HttpResponse, String> {
    let method_str = args.method.unwrap_or_else(|| "GET".to_string());
    let method = Method::from_bytes(method_str.as_bytes())
        .map_err(|e| format!("invalid method '{}': {}", method_str, e))?;

    let mut req = state.client().request(method, &args.url);

    if let Some(headers) = args.headers {
        for (k, v) in headers {
            req = req.header(k, v);
        }
    }

    if let Some(text) = args.body_text {
        req = req.body(text);
    } else if let Some(bytes) = args.body {
        req = req.body(bytes);
    }

    if let Some(ms) = args.timeout_ms {
        req = req.timeout(Duration::from_millis(ms as u64));
    }

    let resp = req.send().await.map_err(|e| e.to_string())?;
    let status = resp.status();
    let mut headers_out: HashMap<String, String> = HashMap::new();
    for (k, v) in resp.headers().iter() {
        if let Ok(vs) = v.to_str() {
            headers_out.insert(k.as_str().to_string(), vs.to_string());
        }
    }
    let body = resp.bytes().await.map_err(|e| e.to_string())?.to_vec();
    Ok(HttpResponse {
        status: status.as_u16(),
        ok: status.is_success(),
        headers: headers_out,
        body,
    })
}

/// Pinning 登録 (frontend が host_info を更新したときに呼ぶ)
#[tauri::command]
pub async fn boo_http_set_pinning(
    host: String,
    fingerprint: String,
    pinning: State<'_, PinningStore>,
) -> Result<(), String> {
    pinning.set(&host, &fingerprint)
}

#[tauri::command]
pub async fn boo_http_unset_pinning(
    host: String,
    pinning: State<'_, PinningStore>,
) -> Result<(), String> {
    pinning.remove(&host)
}
