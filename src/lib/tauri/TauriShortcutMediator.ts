import {type ITauriShortcut, tauriShortcut} from "$lib/tauri/TauriShortcut";
import {tauriObject} from "$lib/tauri/TauriObject";
import {logger} from "$lib/model/DebugLog.svelte";
import {launch} from "$lib/utils/Utils";

/**
 * TauriShortcutは、フォーカスがあるときだけ登録されるようにする。
 * そうしておかないと、OSのショートカットキーとして登録されるので、そのキーが他のアプリで使えなくなる。
 * さらに、Dialog表示中は、ショートカットキーが効かないようにするため、enable/disableを提供する。
 */
class TauriShortcutMediator {
  private scInitializer:(ts:ITauriShortcut)=>Promise<void> = (ts:ITauriShortcut) => { return Promise.resolve() }
  private hasFocus = true
  private enabled = true
  private activated = false
  private tryAgain = false
  private busy = false

  initialize(activate:boolean, fn:(ts:ITauriShortcut) => Promise<void>) {
    this.scInitializer = fn
    this.mediate()
  }
  async terminate() {
    await tauriShortcut.removeAll()
    this.scInitializer = () => { return Promise.resolve() }
  }
  enable() {
    this.enabled = true
    this.mediate()
  }
  disable() {
    this.enabled = false
    this.mediate()
  }
  onBlur() {
    this.hasFocus = false
    this.mediate()
  }
  onFocus() {
    this.hasFocus = true
    this.mediate()
  }
  private mediate() {
    if(!tauriObject.isAvailable) return
    if(this.busy) {
      logger.info("TauriShortcutMediator: busy")
      this.tryAgain = true
      return
    }
    this.busy = true
    launch(async () => {
      try {
        if (this.hasFocus && this.enabled) {
          if (!this.activated) {
            logger.info("TauriShortcutMediator: activate")
            this.activated = true
            await this.scInitializer(tauriShortcut)
          }
        } else {
          if (this.activated) {
            logger.info("TauriShortcutMediator: deactivate")
            this.activated = false
            await tauriShortcut.removeAll()
          }
        }
      } finally {
        this.busy = false
        if (this.tryAgain) {
          logger.info("TauriShortcutMediator: will try again")
          this.tryAgain = false
          this.mediate()
        }
      }
    })
  }
}

export const tauriShortcutMediator = new TauriShortcutMediator()