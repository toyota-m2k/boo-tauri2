use std::sync::{Arc, RwLock};

use axum::body::Body;
use axum::extract::{Path, Request, State};
use axum::http::{HeaderName, HeaderValue, StatusCode};
use axum::response::Response;
use axum::routing::any;
use axum::Router;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;

use crate::boo_http::HttpClient;

/// アプリ起動中に再生対象のホスト情報。Frontend が host を切り替えるたびに更新する。
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveHostInfo {
    pub host: String,
    pub port: u16,
    // フロント側の規約 (IHostInfo.useSSL) と揃えるため SSL は大文字保持で明示 rename。
    // serde camelCase だと use_ssl -> useSsl になり JS 側と一致しない。
    #[serde(rename = "useSSL")]
    pub use_ssl: bool,
    /// 認証トークン (Boo サーバは ?auth=... クエリで要求する)。
    /// proxy 側で勝手に付与せず、frontend が <video src> の URL クエリに既に乗せている前提。
    /// (将来必要になったら使えるようにフィールドだけ用意)
    pub auth_token: Option<String>,
}

#[derive(Clone, Default)]
pub struct ActiveHost {
    inner: Arc<RwLock<Option<ActiveHostInfo>>>,
}

impl ActiveHost {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn set(&self, info: ActiveHostInfo) {
        if let Ok(mut g) = self.inner.write() {
            *g = Some(info);
        }
    }
    pub fn clear(&self) {
        if let Ok(mut g) = self.inner.write() {
            *g = None;
        }
    }
    pub fn get(&self) -> Option<ActiveHostInfo> {
        self.inner.read().ok()?.clone()
    }
}

/// 起動済み proxy の接続情報。Frontend に伝える。
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProxyInfo {
    pub port: u16,
    pub token: String,
}

#[derive(Clone)]
struct ProxyState {
    expected_token: String,
    client: HttpClient,
    active_host: ActiveHost,
}

/// proxy をバックグラウンドで起動。OS 採番ポートと生成された token を ProxyInfo として返す。
pub async fn start(client: HttpClient, active_host: ActiveHost) -> Result<ProxyInfo, String> {
    let token = generate_token();
    let state = ProxyState {
        expected_token: token.clone(),
        client,
        active_host,
    };
    let app = Router::new()
        .route("/{token}/{*rest}", any(proxy_handler))
        .with_state(state);

    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();

    tokio::spawn(async move {
        if let Err(e) = axum::serve(listener, app).await {
            eprintln!("media proxy server error: {}", e);
        }
    });

    Ok(ProxyInfo { port, token })
}

fn generate_token() -> String {
    let mut bytes = [0u8; 24]; // 192 bits
    rand::thread_rng().fill_bytes(&mut bytes);
    hex::encode(bytes)
}

async fn proxy_handler(
    Path((token, rest)): Path<(String, String)>,
    State(state): State<ProxyState>,
    req: Request,
) -> Result<Response, StatusCode> {
    use subtle::ConstantTimeEq;
    if token.len() != state.expected_token.len()
        || !bool::from(token.as_bytes().ct_eq(state.expected_token.as_bytes()))
    {
        return Err(StatusCode::FORBIDDEN);
    }

    let host_info = state.active_host.get().ok_or(StatusCode::SERVICE_UNAVAILABLE)?;
    let scheme = if host_info.use_ssl { "https" } else { "http" };
    let query = req.uri().query();
    let upstream_url = match query {
        Some(q) => format!(
            "{}://{}:{}/{}?{}",
            scheme, host_info.host, host_info.port, rest, q
        ),
        None => format!("{}://{}:{}/{}", scheme, host_info.host, host_info.port, rest),
    };

    let method = reqwest::Method::from_bytes(req.method().as_str().as_bytes())
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let mut up_req = state.client.client().request(method, &upstream_url);

    // ヘッダ転送 (Host / Connection / Content-Length は除外)
    for (name, value) in req.headers().iter() {
        let n = name.as_str();
        if matches!(
            n,
            "host" | "connection" | "content-length" | "transfer-encoding" | "proxy-authorization"
        ) {
            continue;
        }
        if let Ok(v) = value.to_str() {
            up_req = up_req.header(n, v);
        }
    }

    // リクエスト本文 (メディアは GET が大半なので普通は空)
    let body_bytes = axum::body::to_bytes(req.into_body(), usize::MAX)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    if !body_bytes.is_empty() {
        up_req = up_req.body(body_bytes.to_vec());
    }

    let upstream = up_req.send().await.map_err(|e| {
        // 上流接続失敗は珍しいので警告として残す (URL や err 型はそのまま出す)
        eprintln!(
            "media_proxy: upstream send failed url={} err={}",
            upstream_url, e
        );
        StatusCode::BAD_GATEWAY
    })?;

    let status = upstream.status();
    let mut builder = Response::builder()
        .status(StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::OK));

    // レスポンスヘッダ転送 (ホップ毎 / chunked 関連は除外)
    if let Some(headers) = builder.headers_mut() {
        for (name, value) in upstream.headers().iter() {
            let n = name.as_str();
            if matches!(
                n,
                "connection"
                    | "transfer-encoding"
                    | "keep-alive"
                    | "upgrade"
                    | "proxy-authenticate"
                    | "proxy-authorization"
                    | "te"
                    | "trailer"
            ) {
                continue;
            }
            if let (Ok(hn), Ok(hv)) = (
                HeaderName::from_bytes(n.as_bytes()),
                HeaderValue::from_bytes(value.as_bytes()),
            ) {
                headers.append(hn, hv);
            }
        }
    }

    // ストリーミング転送 (Range の partial content も Content-Length が来るのでバッファ無しで OK)
    let stream = upstream.bytes_stream();
    let body = Body::from_stream(stream);
    builder.body(body).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

/// Frontend から呼ばれて proxy 情報を取得する Tauri command
#[tauri::command]
pub fn media_proxy_get_info(info: tauri::State<'_, ProxyInfo>) -> ProxyInfo {
    info.inner().clone()
}

/// Frontend から active host を更新するための Tauri command
#[tauri::command]
pub fn media_proxy_set_active_host(
    info: ActiveHostInfo,
    state: tauri::State<'_, ActiveHost>,
) -> Result<(), String> {
    state.set(info);
    Ok(())
}

#[tauri::command]
pub fn media_proxy_clear_active_host(state: tauri::State<'_, ActiveHost>) -> Result<(), String> {
    state.clear();
    Ok(())
}
