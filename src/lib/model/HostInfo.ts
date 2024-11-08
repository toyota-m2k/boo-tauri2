import type {IHostInfo} from "$lib/model/ModelDef";

export class HostInfo implements IHostInfo {
    displayName: string
    host: string
    port: number

    currentMediaId?: string|undefined
    currentMediaPosition?: number|undefined

    constructor(name: string, host: string, port: number) {
        this.displayName = name
        this.host = host
        this.port = port
    }

    isEquals(hostInfo: IHostInfo): boolean {
        return this.host === hostInfo.host && this.port === hostInfo.port
    }
}