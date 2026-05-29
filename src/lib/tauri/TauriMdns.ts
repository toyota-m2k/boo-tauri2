import {invoke} from "@tauri-apps/api/core"
import {listen, type UnlistenFn} from "@tauri-apps/api/event"
import {logger} from "$lib/model/DebugLog.svelte"

export interface IDiscoveredService {
  serviceName: string
  host: string
  port: number
  useSSL: boolean
  fingerprint?: string
  hostname?: string
  app?: string
  version?: string
}

export interface ITauriMdns {
  start(
    onDiscovered: (s: IDiscoveredService) => void,
    onRemoved: (serviceName: string) => void,
  ): Promise<void>
  stop(): Promise<void>
  resolveOnce(serviceName: string, timeoutMs?: number): Promise<IDiscoveredService | null>
}

class TauriMdns implements ITauriMdns {
  private unlisteners: UnlistenFn[] = []
  private running = false

  async start(
    onDiscovered: (s: IDiscoveredService) => void,
    onRemoved: (serviceName: string) => void,
  ): Promise<void> {
    if (this.running) return
    try {
      const u1 = await listen<IDiscoveredService>("mdns://discovered", (e) => onDiscovered(e.payload))
      const u2 = await listen<string>("mdns://removed", (e) => onRemoved(e.payload))
      this.unlisteners.push(u1, u2)
      await invoke("mdns_discover_start")
      this.running = true
    } catch (e) {
      logger.error(`mdns start failed: ${e}`)
      await this.cleanupListeners()
    }
  }

  async stop(): Promise<void> {
    if (!this.running) return
    try {
      await invoke("mdns_discover_stop")
    } catch (e) {
      logger.error(`mdns stop failed: ${e}`)
    }
    await this.cleanupListeners()
    this.running = false
  }

  async resolveOnce(serviceName: string, timeoutMs: number = 3000): Promise<IDiscoveredService | null> {
    try {
      return await invoke<IDiscoveredService | null>("mdns_resolve_once", {
        serviceName,
        timeoutMs,
      })
    } catch (e) {
      logger.error(`mdns resolve_once failed: ${e}`)
      return null
    }
  }

  private async cleanupListeners(): Promise<void> {
    for (const u of this.unlisteners) {
      try { u() } catch (_) { /* ignore */ }
    }
    this.unlisteners = []
  }
}

export const tauriMdns: ITauriMdns = new TauriMdns()
