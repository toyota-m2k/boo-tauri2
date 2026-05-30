use std::net::Ipv4Addr;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use if_addrs::{IfAddr, Interface};
use mdns_sd::{ResolvedService, ServiceDaemon, ServiceEvent};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

const SERVICE_TYPE: &str = "_booapi._tcp.local.";

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredService {
    pub service_name: String,
    pub host: String,
    pub port: u16,
    // フロント側の規約 (IHostInfo.useSSL) と揃えるため SSL は大文字保持で明示 rename。
    // serde camelCase だと use_ssl -> useSsl になり JS 側で undefined になる。
    #[serde(rename = "useSSL")]
    pub use_ssl: bool,
    pub fingerprint: Option<String>,
    pub hostname: Option<String>,
    pub app: Option<String>,
    pub version: Option<String>,
}

#[derive(Default)]
pub struct MdnsState {
    daemon: Mutex<Option<ServiceDaemon>>,
}

fn strip_service_type(fullname: &str) -> String {
    // fullname e.g. "BooTube on DESKTOP-A12B3C._booapi._tcp.local."
    // service_type e.g. "_booapi._tcp.local."
    let suffix = format!(".{}", SERVICE_TYPE);
    if let Some(stripped) = fullname.strip_suffix(&suffix) {
        return stripped.to_string();
    }
    if let Some(stripped) = fullname.strip_suffix(SERVICE_TYPE) {
        return stripped.trim_end_matches('.').to_string();
    }
    fullname.to_string()
}

/// サーバーが広告した複数 IPv4 から、本機の NIC と同じサブネットに属するものを選ぶ。
/// Hyper-V や WSL 等の仮想 NIC で別アドレスが広告されていても、実 LAN 側を選択する。
/// マッチが無い場合のフォールバックは最小値のソート順 (決定的) で非ループバックを返す。
fn pick_best_addr(candidates: &std::collections::HashSet<Ipv4Addr>) -> Option<Ipv4Addr> {
    let locals: Vec<Interface> = if_addrs::get_if_addrs().unwrap_or_default();

    let mut on_subnet: Vec<Ipv4Addr> = Vec::new();
    for &cand in candidates {
        if cand.is_loopback() || cand.is_unspecified() || cand.is_link_local() {
            continue;
        }
        for iface in &locals {
            if let IfAddr::V4(v4) = &iface.addr {
                if v4.ip.is_loopback() {
                    continue;
                }
                let mask: u32 = u32::from(v4.netmask);
                if mask == 0 {
                    continue;
                }
                let local_net = u32::from(v4.ip) & mask;
                let cand_net = u32::from(cand) & mask;
                if local_net == cand_net {
                    on_subnet.push(cand);
                    break;
                }
            }
        }
    }

    if !on_subnet.is_empty() {
        on_subnet.sort_by_key(|a| u32::from(*a));
        return on_subnet.first().copied();
    }
    // fallback: any non-loopback, smallest first
    let mut others: Vec<Ipv4Addr> = candidates
        .iter()
        .filter(|a| !a.is_loopback() && !a.is_unspecified())
        .copied()
        .collect();
    others.sort_by_key(|a| u32::from(*a));
    others.first().copied()
}

fn build_discovered(info: &ResolvedService) -> Option<DiscoveredService> {
    let port = info.get_port();
    let v4s = info.get_addresses_v4();
    let addr = pick_best_addr(&v4s).map(|a| a.to_string())?;

    let mut use_ssl = false;
    let mut fingerprint = None;
    let mut hostname = None;
    let mut app = None;
    let mut version = None;

    for prop in info.get_properties().iter() {
        let val = prop.val_str();
        match prop.key() {
            "https" => use_ssl = val == "1",
            "fp" => fingerprint = Some(val.to_string()),
            "hostname" => hostname = Some(val.to_string()),
            "app" => app = Some(val.to_string()),
            "version" => version = Some(val.to_string()),
            _ => {}
        }
    }

    Some(DiscoveredService {
        service_name: strip_service_type(info.get_fullname()),
        host: addr,
        port,
        use_ssl,
        fingerprint,
        hostname,
        app,
        version,
    })
}

#[tauri::command]
pub async fn mdns_discover_start(
    app: AppHandle,
    state: State<'_, MdnsState>,
) -> Result<(), String> {
    {
        let guard = state.daemon.lock().map_err(|e| e.to_string())?;
        if guard.is_some() {
            return Ok(());
        }
    }

    let daemon = ServiceDaemon::new().map_err(|e| e.to_string())?;
    let receiver = daemon.browse(SERVICE_TYPE).map_err(|e| e.to_string())?;

    {
        let mut guard = state.daemon.lock().map_err(|e| e.to_string())?;
        *guard = Some(daemon);
    }

    let app_handle = app.clone();
    std::thread::spawn(move || {
        while let Ok(event) = receiver.recv() {
            match event {
                ServiceEvent::ServiceResolved(info) => {
                    if let Some(service) = build_discovered(&info) {
                        let _ = app_handle.emit("mdns://discovered", service);
                    }
                }
                ServiceEvent::ServiceRemoved(_ty, fullname) => {
                    let service_name = strip_service_type(&fullname);
                    let _ = app_handle.emit("mdns://removed", service_name);
                }
                ServiceEvent::SearchStopped(_) => break,
                _ => {}
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn mdns_discover_stop(state: State<'_, MdnsState>) -> Result<(), String> {
    let daemon = {
        let mut guard = state.daemon.lock().map_err(|e| e.to_string())?;
        guard.take()
    };
    if let Some(daemon) = daemon {
        daemon.shutdown().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn mdns_resolve_once(
    service_name: String,
    timeout_ms: u32,
) -> Result<Option<DiscoveredService>, String> {
    let daemon = ServiceDaemon::new().map_err(|e| e.to_string())?;
    let receiver = daemon.browse(SERVICE_TYPE).map_err(|e| e.to_string())?;
    let deadline = Instant::now() + Duration::from_millis(timeout_ms as u64);

    let mut result: Option<DiscoveredService> = None;
    while Instant::now() < deadline {
        let remaining = deadline.saturating_duration_since(Instant::now());
        if remaining.is_zero() {
            break;
        }
        match receiver.recv_timeout(remaining) {
            Ok(ServiceEvent::ServiceResolved(info)) => {
                let name = strip_service_type(info.get_fullname());
                if name == service_name {
                    if let Some(service) = build_discovered(&info) {
                        result = Some(service);
                        break;
                    }
                }
            }
            Ok(_) => {}
            Err(_) => break,
        }
    }

    let _ = daemon.shutdown();
    Ok(result)
}
