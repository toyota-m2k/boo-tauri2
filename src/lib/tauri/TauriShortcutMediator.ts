import {type ITauriShortcut, tauriShortcut} from "$lib/tauri/TauriShortcut";
import {tauriObject} from "$lib/tauri/TauriObject";
import {logger} from "$lib/model/DebugLog.svelte";

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

  async initializer(activate:boolean, fn:(ts:ITauriShortcut) => Promise<void>) {
    this.scInitializer = fn
    await this.mediate()
  }
  async enable() {
    this.enabled = true
    await this.mediate()
  }
  async disable() {
    this.enabled = false
    await this.mediate()
  }
  async onBlur() {
    this.hasFocus = false
    await this.mediate()
  }
  async onFocus() {
    this.hasFocus = true
    await this.mediate()
  }
  private async mediate() {
    if(!tauriObject.isAvailable) return
    if(this.hasFocus && this.enabled) {
      if(!this.activated) {
        logger.debug("TauriShortcutMediator: activate")
        this.activated = true
        await this.scInitializer(tauriShortcut)
      }
    } else {
      if(this.activated) {
        logger.debug("TauriShortcutMediator: deactivate")
        this.activated = false
        await tauriShortcut.removeAll()
      }
    }
  }
}

export const tauriShortcutMediator = new TauriShortcutMediator()