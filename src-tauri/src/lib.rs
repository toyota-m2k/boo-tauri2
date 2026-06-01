mod boo_http;
mod cert_verifier;
mod mdns;
mod media_proxy;

use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // rustls 0.23 はプロセスごとに crypto provider を 1 つ default として登録する必要がある。
    // ClientConfig::builder_with_provider 側で明示渡ししているが、WebPkiServerVerifier の内部などが
    // default を要求するケースに備えて install しておく。
    let _ = rustls::crypto::ring::default_provider().install_default();

    let mut builder = tauri::Builder::default();
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        // global shortcut プラグインは、android / ios ではサポートされない
        builder = builder.plugin(tauri_plugin_global_shortcut::Builder::new().build());
    }
    #[cfg(mobile)]
    {
        // barcode-scanner プラグインは mobile (Android / iOS) 専用
        builder = builder.plugin(tauri_plugin_barcode_scanner::init());
    }

    builder
        .manage(mdns::MdnsState::default())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // PinningStore は HttpClient と Tauri command の双方から触るので clone 可能な形で共有
            let pinning = cert_verifier::PinningStore::new();
            let http_client = boo_http::HttpClient::new(pinning.clone())
                .map_err(|e| format!("HttpClient init failed: {}", e))?;
            let active_host = media_proxy::ActiveHost::new();

            // メディア配信用ローカル HTTP プロキシ起動 (127.0.0.1:0 で OS にポート採番)
            let proxy_info = tauri::async_runtime::block_on(media_proxy::start(
                http_client.clone(),
                active_host.clone(),
            ))
            .map_err(|e| format!("media proxy start failed: {}", e))?;

            app.manage(pinning);
            app.manage(http_client);
            app.manage(active_host);
            app.manage(proxy_info);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            mdns::mdns_discover_start,
            mdns::mdns_discover_stop,
            mdns::mdns_resolve_once,
            boo_http::boo_http_request,
            boo_http::boo_http_set_pinning,
            boo_http::boo_http_unset_pinning,
            media_proxy::media_proxy_get_info,
            media_proxy::media_proxy_set_active_host,
            media_proxy::media_proxy_clear_active_host,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
