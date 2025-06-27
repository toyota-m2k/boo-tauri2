import {
  type ColorVariation, defaultPlayStateOnHost,
  type IHostInfo,
  type IHostInfoList,
  type IHostPort,
  type IPlayStateOnHost,
  type ISettings, type SortKey
} from "$lib/model/ModelDef";
import {HostInfoList} from "$lib/model/HostInfoList.svelte";
import type {PlayMode} from "$lib/protocol/IBooProtocol";
import {Preferences} from "$lib/model/Preferences";
import {launch} from "$lib/utils/Utils";

const KEY_CURRENT_HOST_PORT = 'currentHostPort'
const KEY_HOST_INFO_LIST = 'hostInfoList'
const KEY_PLAY_STATE_ON_HOSTS = 'playStateOnHosts'
const KEY_PLAY_MODE = 'playMode'
const KEY_SLIDE_SHOW_INTERVAL = 'slideShowInterval'
const KEY_COLOR_VARIATION = 'colorVariation'
const KEY_IS_DARK_MODE = 'isDarkMode'
const KEY_ENABLE_DEBUG_LOG = 'enableDebugLog'
const KEY_LOOP_PLAY = 'loopPlay'
const KEY_AUTO_ROTATION = 'autoRotation'
const KEY_USE_CATEGORY = 'useCategory'

class Settings implements ISettings {
  private _preferences = new Preferences()
  private readonly _hostInfoList: HostInfoList = new HostInfoList()
  private _currentHost = $state<IHostInfo|undefined>(undefined)
  private _playMode = $state<PlayMode>("sequential")
  private _slideShowInterval = $state<number>(3)
  private _colorVariation = $state<ColorVariation>('default')
  private _isDarkMode = $state<boolean>(false)
  private _enableDebugLog = $state<boolean>(false)
  private _loopPlay = $state<boolean>(true)
  private _autoRotation = $state<boolean>(false)
  private _useCategory = $state<boolean>(false)

  get hostInfoList(): IHostInfoList {
    return this._hostInfoList
  }

  get currentHost(): IHostInfo|undefined {
    return this._currentHost
  }
  set currentHost(hostInfo: IHostInfo|undefined) {
    if(this._currentHost === hostInfo) return
    this._currentHost = hostInfo
    launch(async ()=> {
      if(hostInfo) {
        await this._preferences.set(KEY_CURRENT_HOST_PORT, {host: hostInfo.host, port: hostInfo.port})
      } else {
        await this._preferences.remove(KEY_CURRENT_HOST_PORT)
      }
    })
  }
  get playMode(): PlayMode {
    return this._playMode
  }
  set playMode(playMode: PlayMode) {
    if(this._playMode === playMode) return
    this._playMode = playMode
    launch(async ()=> await this._preferences.set(KEY_PLAY_MODE, playMode))
  }
  get slideShowInterval(): number {
    return this._slideShowInterval
  }
  set slideShowInterval(interval: number) {
    if(this._slideShowInterval === interval) return
    this._slideShowInterval = interval
    launch(async()=>await this._preferences.set(KEY_SLIDE_SHOW_INTERVAL, interval))
  }
  get colorVariation(): ColorVariation {
    return this._colorVariation
  }
  set colorVariation(colorVariation: ColorVariation) {
    if(this._colorVariation === colorVariation) return
    this._colorVariation = colorVariation
    launch(async()=>await this._preferences.set(KEY_COLOR_VARIATION, colorVariation))
  }
  get isDarkMode(): boolean {
    return this._isDarkMode
  }
  set isDarkMode(isDarkMode: boolean) {
    if(this._isDarkMode === isDarkMode) return
    this._isDarkMode = isDarkMode
    launch(async()=>await this._preferences.set(KEY_IS_DARK_MODE, isDarkMode))
  }
  get enableDebugLog(): boolean {
    return this._enableDebugLog
  }
  set enableDebugLog(enableDebugLog: boolean) {
    if(this._enableDebugLog === enableDebugLog) return
    this._enableDebugLog = enableDebugLog
    launch(async()=>await this._preferences.set(KEY_ENABLE_DEBUG_LOG, enableDebugLog))
  }
  get loopPlay(): boolean {
    return this._loopPlay
  }
  set loopPlay(loopPlay: boolean) {
    if(this._loopPlay === loopPlay) return
    this._loopPlay = loopPlay
    launch(async()=>await this._preferences.set(KEY_LOOP_PLAY, loopPlay))
  }
  get autoRotation(): boolean {
    return this._autoRotation
  }
  set autoRotation(autoRotation: boolean) {
    if(this._autoRotation === autoRotation) return
    this._autoRotation = autoRotation
    launch(async()=>await this._preferences.set(KEY_AUTO_ROTATION, autoRotation))
  }
  get useCategory(): boolean {
    return this._useCategory
  }
  set useCategory(useCategory: boolean) {
    if(this._useCategory === useCategory) return
    this._useCategory = useCategory
    launch(async()=>await this._preferences.set(KEY_USE_CATEGORY, useCategory))
  }
  updateCurrentMediaInfo(mediaId: string|undefined, position: number, targetHost?: IHostPort|undefined):void {
    if (!mediaId) return
    targetHost = targetHost || this.currentHost
    if (!targetHost) return
    const key = `${targetHost.host}@${targetHost.port}`
    const current = this._hostInfoList.playStateOnHosts[key] ?? {...defaultPlayStateOnHost}
    current.currentMediaId = mediaId
    current.currentMediaPosition = position
    this._hostInfoList.playStateOnHosts[key] = current
    launch(()=>this._preferences.set(KEY_PLAY_STATE_ON_HOSTS, this._hostInfoList.playStateOnHosts))
  }

  private updateCurrentPlayListDate(date: number, targetHost?: IHostPort|undefined):void {
    targetHost = targetHost || this.currentHost
    if (!targetHost) return
    const key = `${targetHost.host}@${targetHost.port}`
    const current = this._hostInfoList.playStateOnHosts[key] ?? {...defaultPlayStateOnHost}
    current.playListDate = date
    this._hostInfoList.playStateOnHosts[key] = current
    launch(()=>this._preferences.set(KEY_PLAY_STATE_ON_HOSTS, this._hostInfoList.playStateOnHosts))
  }

  get currentPlayListDate(): number|undefined {
    const targetHost = this.currentHost
    if (!targetHost) return undefined
    const key = `${targetHost.host}@${targetHost.port}`
    const current = this._hostInfoList.playStateOnHosts[key]
    return current ? current.playListDate : undefined
  }

  set currentPlayListDate(date: number|undefined) {
    if(!date) return
    this.updateCurrentPlayListDate(date, this.currentHost)
  }

  updateSortInfo(sortKey:SortKey, descending:boolean, targetHost?: IHostPort|undefined):void {
    targetHost = targetHost || this.currentHost
    if (!targetHost) return
    const key = `${targetHost.host}@${targetHost.port}`
    const current = this._hostInfoList.playStateOnHosts[key] ?? {...defaultPlayStateOnHost}
    current.sortKey = sortKey
    current.descending = descending
    this._hostInfoList.playStateOnHosts[key] = current
    launch(()=>this._preferences.set(KEY_PLAY_STATE_ON_HOSTS, this._hostInfoList.playStateOnHosts))
  }

  saveHostList(): void {
    if(this.hostInfoList.modified) {
      this.hostInfoList.modified = false
      launch(()=>this._preferences.set(KEY_HOST_INFO_LIST, this.hostInfoList.list))
      launch(()=>this._preferences.set(KEY_PLAY_STATE_ON_HOSTS, this._hostInfoList.playStateOnHosts))
    }
  }

  getPlayStateOnHost(hostPort: IHostPort): IPlayStateOnHost|undefined {
    const key = `${hostPort.host}@${hostPort.port}`
    return this._hostInfoList.playStateOnHosts[key]
  }

  async load(): Promise<void> {
    await this._preferences.load()
    if(!await this._preferences.isExist("hostInfoList")) {
      await this._preferences.set(KEY_HOST_INFO_LIST, [
        {
          displayName: "A-Channel",
          host: "192.168.0.151",
          port: 8888
        },
        {
          displayName: "2F-MakibaO-Boo",
          host: "192.168.0.151",
          port: 3500
        },
        {
          displayName: "2F-MakibaO-SA",
          host: "192.168.0.151",
          port: 3800
        },
        {
          displayName: "1F-TamayoPtx-Boo",
          host: "192.168.0.152",
          port: 3500
        },
        {
          displayName: "1F-TamayoPtx-SA",
          host: "192.168.0.152",
          port: 3800
        },
      ])
    }

    this.hostInfoList.set(await this._preferences.get<[]>(KEY_HOST_INFO_LIST) ?? [])
    this._hostInfoList.playStateOnHosts = await this._preferences.get(KEY_PLAY_STATE_ON_HOSTS) ?? {}
    this._currentHost = this.hostInfoList.findByHostPort(await this._preferences.get<IHostPort>(KEY_CURRENT_HOST_PORT)) ?? this.hostInfoList.list[0]
    this._playMode = await this._preferences.get(KEY_PLAY_MODE) ?? 'sequential'
    this._slideShowInterval = await this._preferences.get(KEY_SLIDE_SHOW_INTERVAL) ?? 3
    this._colorVariation = await this._preferences.get(KEY_COLOR_VARIATION) ?? 'default'
    this._isDarkMode = await this._preferences.get(KEY_IS_DARK_MODE) ?? false
    this._enableDebugLog = await this._preferences.get(KEY_ENABLE_DEBUG_LOG) ?? false
    this._loopPlay = await this._preferences.get(KEY_LOOP_PLAY) ?? true
    this._autoRotation = await this._preferences.get(KEY_AUTO_ROTATION) ?? false
    this._useCategory = await this._preferences.get(KEY_USE_CATEGORY) ?? true
  }
}

export const settings:ISettings = new Settings()