import {invoke} from "@tauri-apps/api/core"
import {logger} from "$lib/model/DebugLog.svelte"
import {tauriObject} from "$lib/tauri/TauriObject"

interface IProxyInfo {
  port: number
  token: string
}

interface IActiveHostInfo {
  host: string
  port: number
  useSSL: boolean
  authToken?: string
}

/**
 * Step 2 で導入したローカル HTTP プロキシのフロント側ラッパ。
 *
 * アプリ起動時に Rust 側から proxy port + token を 1 回取得し、
 * Player のメディア URL を `http://127.0.0.1:<port>/<token>/...` 形式で組み立てる。
 *
 * Tauri 非対応環境 (純ブラウザ等) では proxyInfo が undefined のままで、
 * 呼出側は fallback (例: 直接 baseUri を使う) に切り替えれば良い。
 */
class TauriMediaProxy {
  private proxyInfo: IProxyInfo | undefined = undefined
  private prepareError: string | undefined = undefined

  async prepare(): Promise<boolean> {
    if (this.proxyInfo) return true
    if (!tauriObject.isAvailable) {
      this.prepareError = "tauri not available"
      return false
    }
    try {
      const info = await invoke<IProxyInfo>("media_proxy_get_info")
      this.proxyInfo = info
      logger.info(`media proxy ready: 127.0.0.1:${info.port}`)
      return true
    } catch (e) {
      this.prepareError = `${e}`
      logger.error(`media_proxy_get_info failed: ${e}`)
      return false
    }
  }

  get isReady(): boolean {
    return !!this.proxyInfo
  }

  /**
   * 与えられた upstream のパス (`video?id=xxx` 等) を proxy URL に変換。
   * 既に proxyInfo を取得済みであることが前提。準備前は undefined を返す。
   */
  proxify(upstreamPath: string): string | undefined {
    if (!this.proxyInfo) return undefined
    // upstreamPath は先頭スラッシュあり/なしどちらも受ける
    const path = upstreamPath.startsWith("/") ? upstreamPath.slice(1) : upstreamPath
    return `http://127.0.0.1:${this.proxyInfo.port}/${this.proxyInfo.token}/${path}`
  }

  async setActiveHost(info: IActiveHostInfo): Promise<void> {
    if (!tauriObject.isAvailable) return
    try {
      await invoke("media_proxy_set_active_host", {info})
    } catch (e) {
      logger.error(`media_proxy_set_active_host failed: ${e}`)
    }
  }

  async clearActiveHost(): Promise<void> {
    if (!tauriObject.isAvailable) return
    try {
      await invoke("media_proxy_clear_active_host")
    } catch (e) {
      logger.error(`media_proxy_clear_active_host failed: ${e}`)
    }
  }

  /**
   * Pinning store 登録 (HttpClient と TLS verifier が共有). frontend が host を追加/編集したときに呼ぶ。
   */
  async setPinning(host: string, fingerprint: string): Promise<void> {
    if (!tauriObject.isAvailable) return
    try {
      await invoke("boo_http_set_pinning", {host, fingerprint})
    } catch (e) {
      logger.error(`boo_http_set_pinning failed: ${e}`)
    }
  }

  async unsetPinning(host: string): Promise<void> {
    if (!tauriObject.isAvailable) return
    try {
      await invoke("boo_http_unset_pinning", {host})
    } catch (e) {
      logger.error(`boo_http_unset_pinning failed: ${e}`)
    }
  }
}

export const tauriMediaProxy = new TauriMediaProxy()
