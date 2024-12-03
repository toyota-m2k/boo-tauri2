import type {IKey} from "$lib/utils/KeyEvents";
import {
  isRegistered,
  register,
  type ShortcutHandler,
  unregister,
  unregisterAll
} from "@tauri-apps/plugin-global-shortcut";
import {tauriObject} from "$lib/tauri/TauriObject";
import {logger} from "$lib/model/DebugLog.svelte";

export interface ITauriShortcut {
  add(key:IKey|IKey[], callback:()=>void):Promise<ITauriShortcut>
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

  async add(key:IKey|IKey[], callback:()=>void):Promise<ITauriShortcut> {
    if(!tauriObject.desktop) return this

    // tauriのAPIでショートカットキーを登録する
    if(Array.isArray(key)) {
      for (const k of key) {
        await this.add(k, callback)
      }
    } else {
      // キーが登録済みなら何もしない
      const shortcut = this.tauriKeyName(key)
      if(!await isRegistered(shortcut)) {
        await register(shortcut, (e)=>{
          if(e.state=="Pressed") {
            callback()
          }
        })
      }
    }
    return this
  }
  async remove(key:IKey|IKey[]): Promise<ITauriShortcut> {
    if(!tauriObject.desktop) return this
    if(Array.isArray(key)) {
      await unregister(key.map(k=>this.tauriKeyName(k)))
    } else {
      await unregister(this.tauriKeyName(key))
    }
    return this
  }
  async removeAll() : Promise<ITauriShortcut> {
    if(!tauriObject.desktop) return this
    await unregisterAll()
    return this
  }
}

export const tauriShortcut:ITauriShortcut = new TauriShortcut()