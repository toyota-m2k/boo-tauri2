export interface IKVS {
  load():Promise<boolean>
  get<T>(key:string):Promise<T|undefined>
  set<T>(key:string, value:T):Promise<void>
  remove(key:string):Promise<void>
  isExist(key:string):Promise<boolean>
}