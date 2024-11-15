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
  currentMediaId?: string|undefined
  currentMediaPosition?: number|undefined
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

export type ColorVariation = 'default' | 'orange' | 'melon' | 'cherry' | 'grape' | 'carrot' | 'blueberry' | 'soda'

export interface ISettings {
  readonly hostInfoList: IHostInfoList
  currentHost: IHostInfo | undefined
  playMode: PlayMode
  slideShowInterval: number
  colorVariation: ColorVariation
  isDarkMode: boolean
  enableDebugLog: boolean
  updateCurrentMediaInfo(mediaId: string|undefined, position: number, targetHost?: IHostPort|undefined):void
  saveHostList(): void
  load(): Promise<void>
}

export type DialogType = "host" | "system"

export interface IViewModel {
  mediaList: IMediaList
  currentItem: IMediaItem|undefined
}