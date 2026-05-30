import {settings} from "$lib/model/Settings.svelte"
import {hostDiscovery} from "$lib/model/HostDiscovery.svelte"
import {tauriMdns, type IDiscoveredService} from "$lib/tauri/TauriMdns"
import {logger} from "$lib/model/DebugLog.svelte"
import {launch} from "$lib/utils/Utils"
import type {IHostInfo} from "$lib/model/ModelDef"

class ActiveHostTracker {
  private started = false

  start(): void {
    if (this.started) return
    this.started = true
    launch(async () => {
      try {
        await hostDiscovery.start()
      } catch (e) {
        logger.error(`ActiveHostTracker: failed to start mDNS: ${e}`)
      }
    })
    // Watch for matching services and auto-update host address.
    $effect.root(() => {
      $effect(() => {
        const host = settings.currentHost
        if (!host?.serviceName) return
        const matched = hostDiscovery.services.find(s => s.serviceName === host.serviceName)
        if (matched) {
          this.applyIfChanged(host, matched)
        }
      })
    })
  }

  /**
   * Performs a one-shot mDNS resolve for the current host. Returns true if the
   * stored address was updated. Intended for use by ConnectionManager.recover()
   * before retrying a failed connection.
   */
  async refreshHostAddress(timeoutMs: number = 3000): Promise<boolean> {
    const host = settings.currentHost
    if (!host?.serviceName) return false
    const cached = hostDiscovery.services.find(s => s.serviceName === host.serviceName)
    if (cached && this.applyIfChanged(host, cached)) {
      return true
    }
    const resolved = await tauriMdns.resolveOnce(host.serviceName, timeoutMs)
    if (!resolved) return false
    return this.applyIfChanged(host, resolved)
  }

  private applyIfChanged(host: IHostInfo, s: IDiscoveredService): boolean {
    const sameAddr = s.host === host.host && s.port === host.port
    const sameSSL = s.useSSL === (host.useSSL ?? false)
    const sameFp = (s.fingerprint ?? undefined) === (host.fingerprint ?? undefined)
    if (sameAddr && sameSSL && sameFp) return false

    const updated: IHostInfo = {
      ...host,
      host: s.host,
      port: s.port,
      useSSL: s.useSSL,
      fingerprint: s.fingerprint,
      hostname: s.hostname ?? host.hostname,
    }
    if (!settings.hostInfoList.replace(host, updated)) return false
    settings.saveHostList()
    settings.currentHost = updated
    logger.info(`ActiveHostTracker: host address updated ${host.host}:${host.port} -> ${updated.host}:${updated.port}`)
    return true
  }
}

export const activeHostTracker = new ActiveHostTracker()
