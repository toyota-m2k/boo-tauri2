import type {IKey} from "$lib/utils/KeyEvents";
import {register, type ShortcutHandler, unregister, unregisterAll} from "@tauri-apps/plugin-global-shortcut";

export interface ITauriShortcut {
  add(key:IKey|IKey[], callback:ShortcutHandler):Promise<ITauriShortcut>
  remove(key:IKey|IKey[]):Promise<ITauriShortcut>
  removeAll():Promise<ITauriShortcut>
}

class TauriShortcut implements ITauriShortcut {
  tauriKeyName(key:IKey):string {
    let name = ""
    if(key.modifierKey.commandOrControl) {
      name += "CommandOrControl+"
    } else {
      if (key.modifierKey.ctrl) name += "Control+"
      if (key.modifierKey.meta) name += "Meta+"
    }
    if(key.modifierKey.alt) name += "Alt+"
    if(key.modifierKey.shift) name += "Shift+"
    name += key.mainKey.key
    return name
  }

  async add(key:IKey|IKey[], callback:ShortcutHandler):Promise<ITauriShortcut> {
    // tauriのAPIでショートカットキーを登録する
    if(Array.isArray(key)) {
      await register(key.map(k=>this.tauriKeyName(k)), callback)
    } else {
      await register(this.tauriKeyName(key), callback)
    }
    return this
  }
  async remove(key:IKey|IKey[]): Promise<ITauriShortcut> {
    if(Array.isArray(key)) {
      await unregister(key.map(k=>this.tauriKeyName(k)))
    } else {
      await unregister(this.tauriKeyName(key))
    }
    return this
  }
  async removeAll() : Promise<ITauriShortcut> {
    await unregisterAll()
    return this
  }
}

export const tauriShortcut:ITauriShortcut = new TauriShortcut()