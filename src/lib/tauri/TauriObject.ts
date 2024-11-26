import {Window} from "@tauri-apps/api/window";
import {logger} from "$lib/model/DebugLog.svelte";
import {delay, launch} from "$lib/utils/Utils";

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

  toggleFullScreen(complete?: (isFullscreen: boolean) => void): boolean {
    const window = this.window
    if (!window) return false
    launch(async () => {
      if (await window.isMaximized()) {
        await window.unmaximize()
        logger.debug("unmiximized")
        // await window.setFullscreen(false)
        complete?.(false)
      } else {
        // await window.setFullscreen(true)
        await window.maximize()
        logger.debug("maximized")
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
      if (await window.isMaximized()) {
        logger.debug("maximized now")
        await window.unmaximize()
        // await window.setFullscreen(false)
        // フルスクリーン解除後１秒待つ。。。これがないと一旦最小化して、すぐに戻ってきてしまう（Macのみ）
        await delay(1000)
        logger.debug("maximized-->normal")
      }
      await window.minimize()
      logger.debug("normal-->minimized")
    })
    return true
  }
}

export const tauriObject:ITauriObject = new TauriObject()