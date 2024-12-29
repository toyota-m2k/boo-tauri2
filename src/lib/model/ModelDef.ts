import type {IMediaItem, IMediaList, PlayMode} from "$lib/protocol/IBooProtocol";

export interface IHostPort {
  host: string,
  port: number
}

export function isEqualHostPort(a: IHostPort|undefined, b: IHostPort|undefined): boolean {
  return !!a && !!b && (a.host === b.host && a.port === b.port)
}

export interface IHostInfo extends IHostPort {
  displayName: string
}

export interface IHostInfoList {
  list: IHostInfo[]
  modified: boolean

  add(hostInfo: IHostInfo): void
  remove(hostInfo: IHostInfo): void
  update(hostInfo: IHostInfo, displayName:string): void
  set(list: IHostInfo[]): void
  findByHostPort(hostPort: IHostPort|undefined): IHostInfo|undefined
}

export type SortKey = 'name' | 'size' | 'duration' | 'date' | 'server'

export interface IPlayStateOnHost {
  currentMediaId: string,
  currentMediaPosition: number,
  sortKey: SortKey,
  descending: boolean,
}

export type ColorVariation = 'default' | 'orange' | 'melon' | 'cherry' | 'grape' | 'carrot' | 'blueberry' | 'soda'

export interface ISettings {
  readonly hostInfoList: IHostInfoList
  currentHost: IHostInfo | undefined
  playMode: PlayMode
  slideShowInterval: number
  colorVariation: ColorVariation
  isDarkMode: boolean
  enableDebugLog: boolean
  loopPlay: boolean
  getPlayStateOnHost(hostInfo: IHostPort): IPlayStateOnHost|undefined
  updateCurrentMediaInfo(mediaId: string|undefined, position: number, targetHost?: IHostPort|undefined):void
  updateSortInfo(sortKey:SortKey, descending:boolean, targetHost?: IHostPort|undefined):void
  saveHostList(): void
  load(): Promise<void>
}

export interface IViewModel {
  mediaList: IMediaList
  currentItem: IMediaItem|undefined
}