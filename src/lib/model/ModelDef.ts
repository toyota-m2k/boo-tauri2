import type {IMediaItem, IMediaList, PlayMode} from "$lib/protocol/IBooProtocol";

export interface IHostPort {
  host: string,
  port: number
  isEquals(hostInfo: IHostInfo): boolean
}

export interface IHostInfo extends IHostPort {
  displayName: string
  currentMediaId?: string|undefined
  currentMediaPosition?: number|undefined
}

export interface IHostInfoList {
  list: IHostInfo[]
  modified: boolean

  add(hostInfo: IHostInfo): void
  remove(hostInfo: IHostInfo): void
  set(list: IHostInfo[]): void
  findByHostPort(hostPort: IHostPort|undefined): IHostInfo|undefined
}

export interface ISettings {
  readonly hostInfoList: IHostInfoList
  currentHost: IHostInfo | undefined
  playMode: PlayMode
  slideShowInterval: number
  updateCurrentMediaInfo(mediaId: string|undefined, position: number, targetHost?: IHostPort|undefined):void
  saveHostList(): void
  load(): Promise<void>
}

export interface IViewModel {
  mediaList: IMediaList
  currentItem: IMediaItem|undefined
}