import {Window} from "@tauri-apps/api/window";
import {logger} from "$lib/model/DebugLog.svelte";
import {launch} from "$lib/utils/Utils";

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

  toggleFullScreen(complete: (isFullscreen: boolean) => void): boolean {
    const window = this.window
    if (!window) return false
    launch(async () => {
      if (await window.isFullscreen()) {
        await window.setFullscreen(false)
        complete(false)
      } else {
        await window.setFullscreen(true)
        complete(true)
      }
    })
    return true
  }

  minimize() {
    const window = this.window
    if (!window) return false
    launch(async () => {
      if (await window.isFullscreen()) {
        await window.setFullscreen(false)
      }
      await window.minimize()
    })
    return true
  }
}

export const tauriObject:ITauriObject = new TauriObject()