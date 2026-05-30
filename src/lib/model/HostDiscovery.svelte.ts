import {tauriMdns, type IDiscoveredService} from "$lib/tauri/TauriMdns"
import {logger} from "$lib/model/DebugLog.svelte"

class HostDiscovery {
  services = $state<IDiscoveredService[]>([])
  isScanning = $state(false)

  async start(): Promise<void> {
    if (this.isScanning) return
    this.services = []
    this.isScanning = true
    await tauriMdns.start(
      (s) => this.upsert(s),
      (name) => this.remove(name),
    )
    logger.info(`mdns scan started`)
  }

  async stop(): Promise<void> {
    if (!this.isScanning) return
    await tauriMdns.stop()
    this.isScanning = false
    logger.info(`mdns scan stopped`)
  }

  private upsert(s: IDiscoveredService): void {
    const idx = this.services.findIndex(x => x.serviceName === s.serviceName)
    if (idx >= 0) {
      this.services[idx] = s
    } else {
      this.services.push(s)
    }
  }

  private remove(serviceName: string): void {
    const idx = this.services.findIndex(x => x.serviceName === serviceName)
    if (idx >= 0) {
      this.services.splice(idx, 1)
    }
  }
}

export const hostDiscovery = new HostDiscovery()
