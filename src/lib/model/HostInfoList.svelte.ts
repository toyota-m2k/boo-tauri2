import type {IHostInfo, IHostInfoList, IHostPort} from "$lib/model/ModelDef";
import type {HostInfo} from "$lib/model/HostInfo";


export class HostInfoList implements IHostInfoList {
  list = $state([] as IHostInfo[])
  modified: boolean = $state(false)

  findIndex(hostPort: IHostPort|undefined): number {
    if(!hostPort) return -1
    return this.list.findIndex((info) => hostPort.isEquals(info))
  }

  findByHostPort(hostPort: IHostPort|undefined): HostInfo|undefined {
    const index = this.findIndex(hostPort)
    return index >= 0 ? this.list[index] : undefined
  }

  add(hostInfo: IHostInfo): void {
    if(this.findIndex(hostInfo)>=0) return
    this.list.push(hostInfo)
  }

  remove(hostInfo: IHostInfo): void {
    const index = this.findIndex(hostInfo)
    if(index >= 0) {
      this.list.splice(index, 1)
    }
  }

  set(list: IHostInfo[]): void {
    this.list = list
  }
}