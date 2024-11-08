import type {IHostInfo, IHostInfoList, IHostPort, ISettings} from "$lib/model/ModelDef";
import type {HostInfo} from "$lib/model/HostInfo";
import {HostInfoList} from "$lib/model/HostInfoList.svelte";
import type {PlayMode} from "$lib/protocol/IBooProtocol";
import {Preferences} from "$lib/model/Preferences";

class Settings implements ISettings {
  readonly hostInfoList: IHostInfoList = new HostInfoList()
  private _preferences = new Preferences()
  private _currentHost = $state<IHostInfo|undefined>(undefined)
  private _playMode = $state<PlayMode>("sequential")
  private _slideShowInterval = $state<number>(3000)
  private _modified: boolean = $state(false)
  modified: boolean = $derived(this._modified || this.hostInfoList.modified)

  get currentHost(): IHostInfo|undefined {
    return this._currentHost
  }
  set currentHost(hostInfo: IHostInfo|undefined) {
    this._currentHost = hostInfo
    this._modified = true
  }
  get playMode(): PlayMode {
    return this._playMode
  }
  set playMode(playMode: PlayMode) {
    this._playMode = playMode
    this._modified = true
  }
  get slideShowInterval(): number {
    return this._slideShowInterval
  }
  set slideShowInterval(interval: number) {
    this._slideShowInterval = interval
    this._modified = true
  }

  updateCurrentMediaInfo(mediaId: string|undefined, position: number, targetHost?: IHostPort|undefined):void {
    targetHost = targetHost || this.currentHost
    if (!targetHost) return
    const target = this.hostInfoList.findByHostPort(targetHost)
    if(!target) return
    target.currentMediaId = mediaId
    target.currentMediaPosition = position
    this.hostInfoList.modified = true
  }

  async load(): Promise<void> {
    await this._preferences.load()
    this.hostInfoList.set(this._preferences.get('hostInfoList', []))
    this._currentHost = this.hostInfoList.findByHostPort(this._preferences.get('currentHost', undefined))
    this._playMode = this._preferences.get('playMode', 'sequential')
    this._slideShowInterval = this._preferences.get('slideShowInterval', 3000)
  }
  async save(): Promise<void> {

  }
}

export const settings:ISettings = new Settings()