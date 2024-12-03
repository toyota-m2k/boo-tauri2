import {Window} from "@tauri-apps/api/window";
import {logger} from "$lib/model/DebugLog.svelte";
import {delay, launch} from "$lib/utils/Utils";
import {env} from "$lib/utils/Env";
import {getName, getTauriVersion, getVersion} from "@tauri-apps/api/app";
import {isTauri} from "@tauri-apps/api/core";

interface ITauriObject {
  prepare():Promise<boolean>
  isAvailable:boolean
  desktop:boolean
  window:Window|undefined
  toggleFullScreen(complete:(isFullscreen:boolean)=>void):boolean
  minimize():boolean
}

class TauriObject implements ITauriObject {
  isAvailable: boolean = false
  window: Window | undefined = undefined
  tauriVersion: string = ""
  appVersion: string = ""
  desktop: boolean = false


  async prepare() {
    try {
      this.window = new Window('main')
      this.tauriVersion = await getTauriVersion()
      this.appVersion = await getVersion()
      this.isAvailable = true
      logger.info(`tauri available {tauri:${this.tauriVersion}, app:${this.appVersion}}`)
      try {
        const name = await getName()
        await this.window.setTitle(`${name} - v${this.appVersion}`)
        await this.window.isFullscreen()
        this.desktop = true
      } catch(_) {
        logger.info("ios or android")
        this.desktop = false
      }
      return true
    } catch(_) {
      logger.info("tauri not available")
      this.window = undefined
      this.tauriVersion = "no tauri"
      this.appVersion = "<uav>"
      this.isAvailable = false
      this.desktop = false
      return false
    }
  }

  private async maximize(window:Window) {
    // logger.debug("setFullscreen(true)")
    if(this.desktop) {
      await window.setFullscreen(true)
    }
    // if (env.isWin) {
    //   await window.setFullscreen(true)
    //   logger.debug("setFullscreen(true)")
    // } else {
    //   await window.maximize()
    //   logger.debug("maximize")
    // }
  }
  private async unmaximize(window:Window) {
    logger.debug("setFullscreen(false)")
    if(this.desktop) {
      await window.setFullscreen(false)
    }
    // if (env.isWin) {
    //   await window.setFullscreen(false)
    //   logger.debug("setFullscreen(false)")
    // } else {
    //   await window.unmaximize()
    //   logger.debug("unmaximize")
    // }
  }
  private async isMaximized(window:Window):Promise<boolean> {
    if(this.desktop) {
      return await window.isFullscreen()
    } else {
      return false
    }
    // if (env.isWin) {
    //   return await window.isFullscreen()
    // } else {
    //   return await window.isMaximized()
    // }
  }
  toggleFullScreen(complete?: (isFullscreen: boolean) => void): boolean {
    const window = this.window
    if (!window||!this.desktop) return false
    launch(async () => {
      if (await this.isMaximized(window)) {
        await this.unmaximize(window)
        complete?.(false)
      } else {
        await this.maximize(window)
        complete?.(true)
      }
      // const webview = await getCurrentWebview()
      // await webview.setFocus()

      // const webviewWindow = getCurrentWebviewWindow()
      // await webviewWindow.setFocus()

      // await window.setFocus();
    })
    return true
  }

  minimize() {
    const window = this.window
    if (!window||!this.desktop) return false
    logger.debug("minimize() called")
    launch(async () => {
      if(env.isMac) {
        if (await window.isMaximized()) {
          logger.debug("maximized now")
          await this.unmaximize(window)
          // await window.setFullscreen(false)
          // フルスクリーン解除後１秒待つ。。。これがないと一旦最小化して、すぐに戻ってきてしまう（Macのみ）
          await delay(1000)
          logger.debug("maximized-->normal")
        }
      }
      await window.minimize()
      logger.debug("normal-->minimized")
    })
    return true
  }

}

export const tauriObject:ITauriObject = new TauriObject()