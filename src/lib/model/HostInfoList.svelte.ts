import {
  type IHostInfo,
  type IHostInfoList,
  type IHostPort,
  type IPlayStateOnHost,
  isEqualHostPort
} from "$lib/model/ModelDef";


export class HostInfoList implements IHostInfoList {
  list = $state([] as IHostInfo[])
  modified: boolean = $state(false)
  playStateOnHosts : Record<string,IPlayStateOnHost> = {}

  findIndex(hostPort: IHostPort|undefined): number {
    if(!hostPort) return -1
    return this.list.findIndex((info) => isEqualHostPort(hostPort,info))
  }

  findByHostPort(hostPort: IHostPort|undefined): IHostInfo|undefined {
    if(!hostPort) return undefined
    const index = this.findIndex(hostPort)
    return index >= 0 ? this.list[index] : undefined
  }

  add(hostInfo: IHostInfo): void {
    if(this.findIndex(hostInfo)>=0) return
    this.list.push(hostInfo)
    this.modified = true
  }

  remove(hostInfo: IHostInfo): void {
    const index = this.findIndex(hostInfo)
    if(index >= 0) {
      const key = `${hostInfo.host}@${hostInfo.port}`
      this.list.splice(index, 1)
      delete this.playStateOnHosts[key]
      this.modified = true
    }
  }
  update(hostInfo: IHostInfo, displayName:string): void {
    const index = this.findIndex(hostInfo)
    if(index >= 0) {
      this.list[index] = {...hostInfo, displayName}
      this.modified = true
    }
  }

  set(list: IHostInfo[]): void {
    this.list = list
    this.modified = true
  }
}