import type {
  ColorVariation,
  IHostInfo,
  IHostInfoList,
  IHostPort,
  IPlayStateOnHost,
  ISettings
} from "$lib/model/ModelDef";
import {HostInfoList} from "$lib/model/HostInfoList.svelte";
import type {PlayMode} from "$lib/protocol/IBooProtocol";
import {Preferences} from "$lib/model/Preferences";
import {launch} from "$lib/utils/Utils";

class Settings implements ISettings {
  private _preferences = new Preferences()
  private readonly _hostInfoList: HostInfoList = new HostInfoList()
  private _currentHost = $state<IHostInfo|undefined>(undefined)
  private _playMode = $state<PlayMode>("sequential")
  private _slideShowInterval = $state<number>(3)
  private _colorVariation = $state<ColorVariation>('default')
  private _isDarkMode = $state<boolean>(false)
  private _enableDebugLog = $state<boolean>(false)

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
        await this._preferences.set('currentHostPort', {host: hostInfo.host, port: hostInfo.port})
      } else {
        await this._preferences.remove('currentHostPort')
      }
    })
  }
  get playMode(): PlayMode {
    return this._playMode
  }
  set playMode(playMode: PlayMode) {
    if(this._playMode === playMode) return
    this._playMode = playMode
    launch(async ()=> await this._preferences.set('playMode', playMode))
  }
  get slideShowInterval(): number {
    return this._slideShowInterval
  }
  set slideShowInterval(interval: number) {
    if(this._slideShowInterval === interval) return
    this._slideShowInterval = interval
    launch(async()=>await this._preferences.set('slideShowInterval', interval))
  }
  get colorVariation(): ColorVariation {
    return this._colorVariation
  }
  set colorVariation(colorVariation: ColorVariation) {
    if(this._colorVariation === colorVariation) return
    this._colorVariation = colorVariation
    launch(async()=>await this._preferences.set('colorVariation', colorVariation))
  }
  get isDarkMode(): boolean {
    return this._isDarkMode
  }
  set isDarkMode(isDarkMode: boolean) {
    if(this._isDarkMode === isDarkMode) return
    this._isDarkMode = isDarkMode
    launch(async()=>await this._preferences.set('isDarkMode', isDarkMode))
  }
  get enableDebugLog(): boolean {
    return this._enableDebugLog
  }
  set enableDebugLog(enableDebugLog: boolean) {
    if(this._enableDebugLog === enableDebugLog) return
    this._enableDebugLog = enableDebugLog
    launch(async()=>await this._preferences.set('enableDebugLog', enableDebugLog))
  }

  updateCurrentMediaInfo(mediaId: string|undefined, position: number, targetHost?: IHostPort|undefined):void {
    if (!mediaId) return
    targetHost = targetHost || this.currentHost
    if (!targetHost) return
    const key = `${targetHost.host}@${targetHost.port}`
    this._hostInfoList.playStateOnHosts[key] = {
      currentMediaId: mediaId,
      currentMediaPosition: position
    }
    launch(()=>this._preferences.set('playStateOnHosts', this._hostInfoList.playStateOnHosts))
  }

  saveHostList(): void {
    if(this.hostInfoList.modified) {
      this.hostInfoList.modified = false
      launch(()=>this._preferences.set('hostInfoList', this.hostInfoList.list))
      launch(()=>this._preferences.set('playStateOnHosts', this._hostInfoList.playStateOnHosts))
    }
  }

  getPlayStateOnHost(hostPort: IHostPort): IPlayStateOnHost|undefined {
    const key = `${hostPort.host}@${hostPort.port}`
    return this._hostInfoList.playStateOnHosts[key]
  }

  async load(): Promise<void> {
    await this._preferences.load()
    if(!await this._preferences.isExist("hostInfoList")) {
      await this._preferences.set('hostInfoList', [
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

    this.hostInfoList.set(await this._preferences.get<[]>('hostInfoList') ?? [])
    this._hostInfoList.playStateOnHosts = await this._preferences.get('playStateOnHosts') ?? {}
    this._currentHost = this.hostInfoList.findByHostPort(await this._preferences.get<IHostPort>('currentHost')) ?? this.hostInfoList.list[0]
    this._playMode = await this._preferences.get('playMode') ?? 'sequential'
    this._slideShowInterval = await this._preferences.get('slideShowInterval') ?? 3
    this._colorVariation = await this._preferences.get('colorVariation') ?? 'default'
    this._isDarkMode = await this._preferences.get('isDarkMode') ?? false
  }
}

export const settings:ISettings = new Settings()