import type {IHostInfo, DialogType, IHostPort} from "$lib/model/ModelDef";
import {emptyMediaList, type IListRequest, type IMediaItem, type IMediaList} from "$lib/protocol/IBooProtocol";
import {createBooProtocol} from "$lib/protocol/BooProtocol";
import {settings} from "$lib/model/Settings.svelte";
import {globalKeyEvents, keyFor} from "$lib/utils/KeyEvents";
import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
import {logger} from "$lib/model/DebugLog.svelte";
import {tauriEvent} from "$lib/tauri/TauriEvent";
import {launch} from "$lib/utils/Utils";
import {untrack} from "svelte";
import {tauriObject} from "$lib/tauri/TauriObject";
import {PasswordViewModel} from "$lib/model/PasswordViewModel.svelte";

class ViewModel {
  private rawMediaList = $state<IMediaList>(emptyMediaList())

  // ホスト側のサポート状況
  videoSupported = $state(false)
  audioSupported = $state(false)
  photoSupported = $state(false)

  // クライアント側フィルター
  acceptVideo = $state(true)
  acceptAudio = $state(true)
  acceptPhoto = $state(true)

  mediaList:IMediaList = $derived.by(()=>{
    return {list:this.rawMediaList.list.filter(item=>{
      switch(item.media) {
        case "v": return this.acceptVideo
        case "a": return this.acceptAudio
        case "p": return this.acceptPhoto
        default: return false
      }
    }), date:this.rawMediaList.date}
  })
  currentItem = $state<IMediaItem|undefined>(undefined)

  hasPrev = $derived(this.currentItem ? this.mediaList.list.indexOf(this.currentItem)>0 : false)
  hasNext = $derived(this.currentItem ? this.mediaList.list.indexOf(this.currentItem)<this.mediaList.list.length-1 : false)
  prev() {
    if(this.currentItem) {
      const index = this.mediaList.list.indexOf(this.currentItem)
      if(index>0) {
        this.currentItem = this.mediaList.list[index-1]
      }
    } else if(this.mediaList.list.length>0) {
      this.currentItem = this.mediaList.list[0]
    }
  }
  next() {
    if(this.currentItem) {
      const index = this.mediaList.list.indexOf(this.currentItem)
      if(index<this.mediaList.list.length-1) {
        this.currentItem = this.mediaList.list[index+1]
      }
    } else if(this.mediaList.list.length>0) {
      this.currentItem = this.mediaList.list[0]
    }
  }
  toggleFullScreen() {
    return tauriObject.toggleFullScreen((fullscreen:boolean) => {
      // this.fullscreenPlayer = fullscreen
    })
  }

  emergencyMinimize() {
    playerViewModel.pause()
    tauriObject.minimize()
    return true
  }

  togglePlay() {
    playerViewModel.togglePlay()
    return true
  }

  isBusy = $state(false)

  boo = createBooProtocol((target:string|undefined)=> this.authenticate(target))
  private listRequest: IListRequest = {type: "all", sourceType: 1}

  isPrepared = $state(false)

  loading = $derived(this.isBusy||!this.isPrepared)

  async prepareSettings() {
    if(this.isPrepared) return
    this.initKeyMap()
    await this.initEventListeners()
    await settings.load()
    this.isPrepared = true
  }

  private initKeyMap() {
    globalKeyEvents
      .register(keyFor({key: "ArrowUp", asCode: true}, {}), () => { viewModel.prev(); return true })
      .register(keyFor({key: "ArrowDown", asCode: true}, {}), () => { viewModel.next(); return true})
      .register([
          keyFor({key: "F11", asCode: true}, {}, "W"),
          keyFor({key: "KeyF", asCode: true}, {commandOrControl: true}),],
        () => this.toggleFullScreen())
      .register([
        keyFor({key: "NumpadEnter", asCode: true}),
        keyFor({key: "Escape", asCode: false}),],
        () => this.emergencyMinimize())
      .register(
        keyFor({key: "Space", asCode: true}, {}),
        () => this.togglePlay())

      .activate()
  }
  private async initEventListeners() {
    // document.addEventListener('fullscreenchange', () => {
    //   logger.info('initEventListeners')
    //   this.fullscreenPlayer = !!document.fullscreenElement;
    // })
    try {
      // tauriEvent.onFocus((e) => {
      //   logger.info(`onFocus: ${e}`)
      // })
      // tauriEvent.onBlur((e) => {
      //   logger.info(`onBlur: ${e}`)
      // })
      await tauriEvent.onTerminating(() => {
        logger.info(`onTerminating`)
        this.saveCurrentMediaInfo()
        return Promise.resolve(true)
        // if(confirm('アプリケーションを終了しますか？')) {
        //   this.saveCurrentMediaInfo()
        //   return Promise.resolve(true)
        // } else {
        //   return Promise.resolve(false)
        // }
      })
    } catch(e) {
      logger.warn(`no tauri: ${e}`)
    }
  }


  private previousHostInfo: IHostPort|undefined = undefined

  onHostChanged(newHost:IHostInfo|undefined) {
    // $effect()から呼ばれるが、このメソッド内で参照している$state/$derived、
    //  - this.mediaList
    //  - playState.currentMediaId
    //  - playerViewModel.currentPosition
    //  - this.previousHostInfo (ソースが引数で渡された $stateな値なので）
    // がトラッキングされると、
    // このメソッドが再帰的に呼ばれるため、untrack()でトラッキングを禁止する。
    untrack(() => {
      const hostPort = newHost
      if (!hostPort) return

      // 現在の再生情報を記憶
      playerViewModel.pause()
      if (this.previousHostInfo) {
        settings.updateCurrentMediaInfo(this.currentItem?.id, playerViewModel.currentPosition, this.previousHostInfo)
      }
      this.previousHostInfo = hostPort

      // 情報更新前にクリア
      this.rawMediaList = emptyMediaList()
      this.currentItem = undefined

      this.isBusy = true
      launch(async () => {
        try {
          if (await this.boo.setup(hostPort)) {
            this.videoSupported = this.boo.isSupported("v")
            this.audioSupported = this.boo.isSupported("a")
            this.photoSupported = this.boo.isSupported("p")
            this.rawMediaList = await this.boo.list(this.listRequest)

            // 前回の再生位置を復元
            let item: IMediaItem | undefined = undefined
            const playState = settings.getPlayStateOnHost(hostPort)
            if (playState) {
              item = this.mediaList.list.find((item) => item.id === playState.currentMediaId)
              if (item) {
                playerViewModel.initialSeekPosition = playState.currentMediaPosition ?? 0
              }
            }
            this.currentItem = item ?? this.mediaList.list[0]
            playerViewModel.play()
          }
        } finally {
          this.isBusy = false
        }
      })
    })
  }

  mediaUrl(mediaItem: IMediaItem|undefined, generation:number): string|undefined {
    if(!mediaItem) return undefined
    return this.boo.getItemUrl(mediaItem)
  }

  async refreshAuth(): Promise<boolean> {
    return await this.boo.noop()
  }

  mediaScale: number = $state(1)

  dialogType: DialogType|undefined = $state()
  closeDialog() {
    this.dialogType = undefined
    this.passwordViewModel.cancel()
  }
  openSystemDialog() {
    this.dialogType = "system"
  }
  openHostDialog() {
    this.dialogType = "host"
  }

  passwordViewModel = new PasswordViewModel()

  authenticate(target:string|undefined):Promise<string|undefined> {
    this.dialogType = "password"
    return this.passwordViewModel.waitFor(target)
  }

  fullscreenPlayer = $state(false)

  saveCurrentMediaInfo() {
    if(this.currentItem) {
      settings.updateCurrentMediaInfo(this.currentItem.id, playerViewModel.currentPosition)
    }
  }
}


export const viewModel = new ViewModel()