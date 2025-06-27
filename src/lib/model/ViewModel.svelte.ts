import type {IHostInfo, IHostPort} from "$lib/model/ModelDef";
import {
  emptyMediaList,
  type IListRequest,
  type IMediaItem,
  type IMediaList
} from "$lib/protocol/IBooProtocol";
import {createBooProtocol} from "$lib/protocol/BooProtocol";
import {settings} from "$lib/model/Settings.svelte";
import {globalKeyEvents, type IKeyEvents, keyFor, switchKeyEventCaster} from "$lib/utils/KeyEvents";
import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
import {logger} from "$lib/model/DebugLog.svelte";
import {tauriEvent} from "$lib/tauri/TauriEvent";
import {launch} from "$lib/utils/Utils";
import {untrack} from "svelte";
import {tauriObject} from "$lib/tauri/TauriObject";
import {tauriShortcutMediator} from "$lib/tauri/TauriShortcutMediator";
import {passwordViewModel} from "$lib/model/PasswordViewModel.svelte";
import {sortViewModel} from "$lib/model/SortViewModel.svelte";
import {connectionManager} from "$lib/model/ConnectionManager";
import {wakeLocker} from "$lib/utils/WakeLocker";

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

  mediaList:IMediaList = $derived.by(()=> {
    if (!this.rawMediaList || this.rawMediaList.list.length === 0) return {list:[],date:this.rawMediaList.date}
    let list = this.rawMediaList.list.filter(item => {
      switch (item.media) {
        case "v":
          return this.acceptVideo
        case "a":
          return this.acceptAudio
        case "p":
          return this.acceptPhoto
        default:
          return false
      }
    })
    if (sortViewModel.sortKey !== "server") {
      const c = sortViewModel.descending ? -1 : 1
      list.sort((a, b) => {
        switch(sortViewModel.sortKey) {
          case "name":
            return a.name.localeCompare(b.name) * c
          case "size":
            return (a.size - b.size) * c
          case "duration":
            return ((a.duration ?? 0) - (b.duration ?? 0)) * c
          case "date":
            if(a.date && b.date) {
              return (a.date - b.date) * c
            } else {
              return parseInt(a.id) - parseInt(b.id) * c
            }
          default:
            return 0
        }
      })
    } else if(sortViewModel.descending) {
      list.reverse()
    }
    return {list, date: this.rawMediaList.date}
  })

  scrollToItem: ((item:string|undefined)=>void)|undefined = undefined
  ensureCurrentItemVisible() {
    this.scrollToItem?.(this.currentItem?.id)
  }

  currentItem = $state<IMediaItem|undefined>(undefined)

  hasPrev = $derived(this.currentItem && (settings.loopPlay || this.mediaList.list.indexOf(this.currentItem)>0))
  hasNext = $derived(this.currentItem && (settings.loopPlay || this.mediaList.list.indexOf(this.currentItem)<this.mediaList.list.length-1))
  prev() {
    if (this.currentItem) {
      const index = this.mediaList.list.indexOf(this.currentItem)
      if (index > 0) {
        this.currentItem = this.mediaList.list[index - 1]
      } else if (settings.loopPlay && this.mediaList.list.length > 0) {
        this.currentItem = this.mediaList.list[this.mediaList.list.length - 1]  // ループ再生なら最後に戻る
      } else {
        return
      }
    } else if (settings.loopPlay && this.mediaList.list.length > 0) {
      this.currentItem = this.mediaList.list[0]
    }
    if(playerViewModel.playRequested) {
      wakeLocker.lock()
    }

    // this.checkUpdateIfNeed()
  }

  next() {
    if(this.currentItem) {
      const index = this.mediaList.list.indexOf(this.currentItem)
      if(index<this.mediaList.list.length-1) {
        this.currentItem = this.mediaList.list[index+1]
      } else if(settings.loopPlay && this.mediaList.list.length>0) {
        this.currentItem = this.mediaList.list[0] // ループ再生なら最初に戻る
      } else {
        return
      }
    } else if(settings.loopPlay && this.mediaList.list.length>0) {
      this.currentItem = this.mediaList.list[0]
    }
    if(playerViewModel.playRequested) {
      wakeLocker.lock()
    }
  }

  onFullScreen: ((fullscreen:boolean)=>void)|undefined = undefined

  toggleFullScreen() {
    return tauriObject.toggleFullScreen((fullscreen:boolean) => {
      // this.fullscreenPlayer = fullscreen
      launch(async ()=>{
        this.onFullScreen?.(fullscreen)
      })
    })
  }

  emergencyMinimize() {
    logger.debug("emergencyMinimize")
    playerViewModel.pause()
    tauriObject.minimize()
    return true
  }

  togglePlay() {
    playerViewModel.togglePlay()
    return true
  }

  isBusy = $state(false)

  boo = createBooProtocol((target:string|undefined)=> passwordViewModel.authenticate(target))
  private listRequest: IListRequest = {type: "all", sourceType: 1}

  isPrepared = $state(false)
  supportChapter = $state(false)
  supportCategory = $state(false)
  categories: string[] = $state([])
  enableCategory = $state(false)
  currentCategory = $state<string|undefined>(undefined)
  loading = $derived(this.isBusy||!this.isPrepared)
  get token() { return this.boo.authInfo.token }

  async prepareSettings() {
    if(this.isPrepared) return
    await settings.load()
    this.initKeyMap()
    await this.initTauri()
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
      // .register([
      //   keyFor({key: "NumpadEnter", asCode: true}),
      //   keyFor({key: "Escape", asCode: false}),],
      //   () => this.emergencyMinimize())
      .register(
        keyFor({key: "Space", asCode: true}, {}),
        () => this.togglePlay())
      .activate()
  }

  private async initTauri() {
    if(await tauriObject.prepare()) {
      await this.initTauriEventListeners()
      await this.registerTauriShortcut()
    }
  }


  private async registerTauriShortcut() {
    if(!tauriObject.isAvailable) return
    logger.debug("registerTauriShortcut")
    tauriShortcutMediator.initialize(true, async (tauriShortcut) => {
      await tauriShortcut
        .add([
            keyFor({key: "Escape", asCode: false}),
            keyFor({key: "NumpadEnter", asCode: false})],
          () => this.emergencyMinimize())
    })
  }

  private async initTauriEventListeners() {
    // document.addEventListener('fullscreenchange', () => {
    //   logger.info('initEventListeners')
    //   this.fullscreenPlayer = !!document.fullscreenElement;
    // })
    if(!tauriObject.isAvailable) return
    try {
      await tauriEvent.onFocus(() => {
        logger.info(`onFocus`)
        tauriShortcutMediator.onFocus()
      })
      await tauriEvent.onBlur(() => {
        logger.info(`onBlur`)
        tauriShortcutMediator.onBlur()
      })
      await tauriEvent.onTerminating(async () => {
        logger.info(`onTerminating`)
        this.saveCurrentMediaInfo()
        await tauriShortcutMediator.terminate()
        connectionManager.stop()
        return true
      })
    } catch(e) {
      logger.warn(`no tauri: ${e}`)
    }
  }

  switchKeyMapOnDialog(subEvents:IKeyEvents) {
    const revert = switchKeyEventCaster(subEvents)
    tauriShortcutMediator.disable()
    return () => {
      revert()
      tauriShortcutMediator.enable()
    }
  }

  private previousHostInfo: IHostPort|undefined = undefined
  // sortKey: SortKey = $state("server")
  // descending: boolean = $state(false)

  onHostChanged(newHost:IHostInfo|undefined, autoReload:boolean) {
    // $effect()から呼ばれるが、このメソッド内で参照している$state/$derived、
    //  - this.mediaList
    //  - playState.currentMediaId
    //  - playerViewModel.currentPosition
    //  - this.previousHostInfo (ソースが引数で渡された $stateな値なので）
    // がトラッキングされると、
    // このメソッドが再帰的に呼ばれるため、untrack()でトラッキングを禁止する。
    untrack(() => {
      logger.info(`onHostChanged: ${newHost?.host}:${newHost?.port}`)
      const hostPort = newHost
      if (!hostPort) return

      connectionManager.stop()

      // 現在の再生情報を記憶
      playerViewModel.pause()
      if (this.previousHostInfo) {
        settings.updateCurrentMediaInfo(this.currentItem?.id, playerViewModel.currentPosition, this.previousHostInfo)
      }
      this.previousHostInfo = hostPort

      // 情報更新前にクリア
      this.rawMediaList = emptyMediaList()
      this.currentItem = undefined
      this.supportCategory = false
      this.supportChapter = false
      this.enableCategory = false
      this.categories = []
      sortViewModel.reset()

      this.isBusy = true
      launch(async () => {
        try {
          if (await this.boo.setup(hostPort)) {
            const capabilities = this.boo.capabilities
            connectionManager.start(hostPort, capabilities)
            const playState = settings.getPlayStateOnHost(hostPort)
            this.videoSupported = this.boo.isSupported("v")
            this.audioSupported = this.boo.isSupported("a")
            this.photoSupported = this.boo.isSupported("p")
            sortViewModel.load(playState)
            this.rawMediaList = await this.boo.list(this.listRequest, !autoReload)

            // 前回の再生位置を復元
            let item: IMediaItem | undefined = undefined
            if (playState) {
              item = this.mediaList.list.find((item) => item.id === playState.currentMediaId)
              if (item) {
                playerViewModel.initialSeekPosition = playState.currentMediaPosition ?? 0
              }
            }
            this.currentItem = item ?? this.mediaList.list[0]
            this.supportChapter = this.boo.capabilities?.chapter ?? false
            this.supportCategory = this.boo.capabilities?.category ?? false
            this.categories = this.boo.categories
            playerViewModel.play()
          }
        } finally {
          this.isBusy = false
        }
      })
    })
  }

  async setCategory(enable:boolean, category: string|undefined) {
    if(!this.supportCategory||!this.categories||!this.categories[0]) return
    const originalItem = this.currentItem
    const position = playerViewModel.currentPosition
    if (enable) {
      this.currentCategory = category ?? this.currentCategory ?? this.categories[0]
      this.enableCategory = true
    } else {
      this.enableCategory = false
    }
    let request = this.listRequest
    if(this.enableCategory && this.currentCategory) {
      request = {sourceType:0, type:"all", category: this.currentCategory}
    }
    this.rawMediaList = await this.boo.list(request, true)

    // 前回の再生位置を復元
    let item: IMediaItem | undefined = undefined
    if(originalItem) {
      item = this.mediaList.list.find((item) => item.id === originalItem.id)
    }
    if(item) {
      playerViewModel.initialSeekPosition = position
      this.currentItem = item
    } else {
      playerViewModel.initialSeekPosition = 0
      this.currentItem = this.mediaList.list[0]
    }
    this.ensureCurrentItemVisible()
  }

  reloadPlayList(autoReload:boolean = false) {
    logger.info("reloadPlayList")
    this.previousHostInfo = settings.currentHost
    this.onHostChanged(settings.currentHost, autoReload)
  }

  async checkUpdateIfNeed() {
    if(this.boo.capabilities?.diff) {
      // リストの自動更新をサポートしている
      // logger.info("checking update")
      if (await this.boo.checkUpdate(this.rawMediaList.date)) {
        logger.info("checkUpdate-->need to update")
        this.reloadPlayList(true)
      }
    }
  }
  async refreshAuthIfNeed() {
    if(this.boo.capabilities?.authentication) {
      const currentToken = this.token
      playerViewModel.initialSeekPosition = playerViewModel.currentPosition
      await this.tryConnect()
      if (currentToken === this.token) {
        logger.info("refreshAuthIfNeed(): token not changed")
        playerViewModel.initialSeekPosition = 0
      } else {
        logger.info("refreshAuthIfNeed(): token changed")
      }
    }
  }
  async tryConnect(): Promise<boolean> {
    // if (playerViewModel.isAV) {
    //   playerViewModel.initialSeekPosition = playerViewModel.currentPosition
    // }
    return await this.boo.touch()
  }


  mediaUrl(mediaItem: IMediaItem|undefined, token:string|undefined): string|undefined {
    if(!mediaItem) return undefined
    return this.boo.getItemUrl(mediaItem, token)
  }

  mediaScale: number = $state(1)

  fullscreenPlayer = $state(false)

  saveCurrentMediaInfo() {
    if(this.currentItem) {
      settings.updateCurrentMediaInfo(this.currentItem.id, playerViewModel.currentPosition)
    }
  }
}


export const viewModel = new ViewModel()