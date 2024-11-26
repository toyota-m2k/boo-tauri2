import {Window} from "@tauri-apps/api/window";
import {logger} from "$lib/model/DebugLog.svelte";
import {delay, launch} from "$lib/utils/Utils";
import {env} from "$lib/utils/Env";

interface ITauriObject {
  isAvailable:boolean
  window:Window|undefined
  toggleFullScreen(complete:(isFullscreen:boolean)=>void):boolean
  minimize():boolean
}

class TauriObject implements ITauriObject {
  isAvailable: boolean = false
  window: Window | undefined


  constructor() {
    try {
      this.window = new Window('main')
      this.isAvailable = true
    } catch (e) {
      logger.info(`tauri not available ${e}`)
    }
  }

  private async maximize(window:Window) {
    if (env.isWin) {
      await window.setFullscreen(true)
      logger.debug("setFullscreen(true)")
    } else {
      await window.maximize()
      logger.debug("maximize")
    }
  }
  private async unmaximize(window:Window) {
    if (env.isWin) {
      await window.setFullscreen(false)
      logger.debug("setFullscreen(false)")
    } else {
      await window.unmaximize()
      logger.debug("unmaximize")
    }
  }
  private async isMaximized(window:Window):Promise<boolean> {
    if (env.isWin) {
      return await window.isFullscreen()
    } else {
      return await window.isMaximized()
    }
  }
  toggleFullScreen(complete?: (isFullscreen: boolean) => void): boolean {
    const window = this.window
    if (!window) return false
    launch(async () => {
      if (await this.isMaximized(window)) {
        await this.unmaximize(window)
        complete?.(false)
      } else {
        await this.maximize(window)
        complete?.(true)
      }
    })
    return true
  }

  minimize() {
    const window = this.window
    if (!window) return false
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