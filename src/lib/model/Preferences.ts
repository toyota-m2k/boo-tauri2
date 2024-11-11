import {logger} from "$lib/model/DebugLog.svelte";
import type {IKVS} from "$lib/model/kvs/IKVS";
import {tauriStore} from "$lib/model/kvs/TauriStore";
import {onMemoryStore} from "$lib/model/kvs/OnMemoryStroe";

export class Preferences implements IKVS {
  private _kvs: IKVS | undefined
  private get kvs(): IKVS { return this._kvs as IKVS }

  public async load(): Promise<boolean> {
    const ts = tauriStore
    if(await ts.load()) {
      this._kvs = ts
      logger.debug('Preferences: TauriStore loaded')
    } else {
      this._kvs = onMemoryStore
      logger.debug('Preferences: OnMemoryStore loaded')
    }
    return true
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.kvs.get(key)
  }
  async set<T>(key: string, value: T): Promise<void> {
    await this.kvs.set(key, value)
  }
  async isExist(key: string): Promise<boolean> {
    return this.kvs.isExist(key)
  }
  async remove(key: string): Promise<void> {
    await this.kvs.remove(key)
  }
}