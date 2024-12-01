import { type Store, load } from '@tauri-apps/plugin-store'
import type {IKVS} from "$lib/model/kvs/IKVS";

class TauriStore implements IKVS {
  private _store: Store|undefined
  private get store():Store {
    console.assert(this._store!==undefined)
    return this._store!!
  }
  async load() {
    try {
      this._store = await load('settings.json', {autoSave: true});
      return !!this._store
    } catch {
      return false
    }
  }
  async set<T>(key:string,value:T) {
    await this.store.set(key, {value:value})
  }
  async get<T>(key:string):Promise<T|undefined> {
    const kv = await this.store.get<{value:T}>(key)
    return kv?.value
  }
  async isExist(key:string) {
    return await this.store.has(key)
  }
  async remove(key:string) {
    await this.store.delete(key)
    return
  }
}

export const tauriStore:IKVS = new TauriStore()