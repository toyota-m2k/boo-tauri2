import type {IHostInfo, IHostInfoList, IHostPort, ISettings} from "$lib/model/ModelDef";
import {HostInfoList} from "$lib/model/HostInfoList.svelte";
import type {PlayMode} from "$lib/protocol/IBooProtocol";
import {Preferences} from "$lib/model/Preferences";
import {launch} from "$lib/utils/Utils";

class Settings implements ISettings {
  private _preferences = new Preferences()
  readonly hostInfoList: IHostInfoList = new HostInfoList()
  private _currentHost = $state<IHostInfo|undefined>(undefined)
  private _playMode = $state<PlayMode>("sequential")
  private _slideShowInterval = $state<number>(3000)

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

  updateCurrentMediaInfo(mediaId: string|undefined, position: number, targetHost?: IHostPort|undefined):void {
    targetHost = targetHost || this.currentHost
    if (!targetHost) return
    const target = this.hostInfoList.findByHostPort(targetHost)
    if(!target) return
    if(target.currentMediaId === mediaId && target.currentMediaPosition === position) return
    target.currentMediaId = mediaId
    target.currentMediaPosition = position
    this.hostInfoList.modified = true
    this.saveHostList()
  }

  saveHostList(): void {
    if(this.hostInfoList.modified) {
      this.hostInfoList.modified = false
      launch(()=>this._preferences.set('hostInfoList', this.hostInfoList.list))
    }
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
    this._currentHost = this.hostInfoList.findByHostPort(await this._preferences.get<IHostPort>('currentHost')) ?? this.hostInfoList.list[0]
    this._playMode = await this._preferences.get('playMode') ?? 'sequential'
    this._slideShowInterval = await this._preferences.get('slideShowInterval') ?? 3000
  }
}

export const settings:ISettings = new Settings()