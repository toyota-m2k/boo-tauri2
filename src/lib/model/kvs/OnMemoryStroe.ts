import type {IKVS} from "$lib/model/kvs/IKVS";

class OnMemoryStore implements IKVS {
  private map:Record<string,unknown> = {}
  load():Promise<boolean> {
    return Promise.resolve(true)
  }
  get<T>(key:string):Promise<T|undefined> {
    return Promise.resolve(this.map[key] as T|undefined)
  }
  set<T>(key:string, value:T):Promise<void> {
    this.map[key] = value
    return Promise.resolve()
  }
  isExist(key: string): Promise<boolean> {
    return Promise.resolve(!!this.map[key])
  }
  remove(key: string): Promise<void> {
    delete this.map[key]
    return Promise.resolve()
  }
}

export const onMemoryStore:IKVS = new OnMemoryStore()