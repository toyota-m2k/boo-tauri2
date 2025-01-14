import type {IHostInfo, IHostPort, SortKey} from "$lib/model/ModelDef";
import {emptyMediaList, type IListRequest, type IMediaItem, type IMediaList} from "$lib/protocol/IBooProtocol";
import {createBooProtocol} from "$lib/protocol/BooProtocol";
import {settings} from "$lib/model/Settings.svelte";
import {globalKeyEvents, type IKeyEvents, keyFor, switchKeyEventCaster} from "$lib/utils/KeyEvents";
import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
import {logger} from "$lib/model/DebugLog.svelte";
import {tauriEvent} from "$lib/tauri/TauriEvent";
import {delay, launch} from "$lib/utils/Utils";
import {untrack} from "svelte";
import {tauriObject} from "$lib/tauri/TauriObject";
import {tauriShortcutMediator} from "$lib/tauri/TauriShortcutMediator";
import {passwordViewModel} from "$lib/model/PasswordViewModel.svelte";
import {sortViewModel} from "$lib/model/SortViewModel.svelte";

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

  scrollToCurrentItem: ((item:string|undefined)=>void)|undefined = undefined
  ensureCurrentItemVisible() {
    this.scrollToCurrentItem?.(this.currentItem?.id)
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
      }
    } else if (settings.loopPlay && this.mediaList.list.length > 0) {
      this.currentItem = this.mediaList.list[0]
    }
    this.checkUpdateIfNeed()
  }

  next() {
    if(this.currentItem) {
      const index = this.mediaList.list.indexOf(this.currentItem)
      if(index<this.mediaList.list.length-1) {
        this.currentItem = this.mediaList.list[index+1]
      } else if(settings.loopPlay && this.mediaList.list.length>0) {
        this.currentItem = this.mediaList.list[0] // ループ再生なら最初に戻る
      }
    } else if(settings.loopPlay && this.mediaList.list.length>0) {
      this.currentItem = this.mediaList.list[0]
    }
    this.checkUpdateIfNeed()
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

  loading = $derived(this.isBusy||!this.isPrepared)

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
    await tauriShortcutMediator.initialize(true, async (tauriShortcut) => {
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
      await tauriEvent.onFocus(async (e) => {
        logger.info(`onFocus`)
        await tauriShortcutMediator.onFocus()
      })
      await tauriEvent.onBlur(async (e) => {
        logger.info(`onBlur`)
        await tauriShortcutMediator.onBlur()
      })
      await tauriEvent.onTerminating(async () => {
        logger.info(`onTerminating`)
        this.saveCurrentMediaInfo()
        await tauriShortcutMediator.terminate()
        return true
      })
    } catch(e) {
      logger.warn(`no tauri: ${e}`)
    }
  }

  async switchKeyMapOnDialog(subEvents:IKeyEvents) {
    await tauriShortcutMediator.disable()
    const revert = switchKeyEventCaster(subEvents)
    return async () => {
      revert()
      await tauriShortcutMediator.enable()
    }
  }

  private previousHostInfo: IHostPort|undefined = undefined
  // sortKey: SortKey = $state("server")
  // descending: boolean = $state(false)

  onHostChanged(newHost:IHostInfo|undefined) {
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

      // 現在の再生情報を記憶
      playerViewModel.pause()
      if (this.previousHostInfo) {
        settings.updateCurrentMediaInfo(this.currentItem?.id, playerViewModel.currentPosition, this.previousHostInfo)
      }
      this.previousHostInfo = hostPort

      // 情報更新前にクリア
      this.rawMediaList = emptyMediaList()
      this.currentItem = undefined
      sortViewModel.reset()

      this.isBusy = true
      launch(async () => {
        try {
          if (await this.boo.setup(hostPort)) {
            const playState = settings.getPlayStateOnHost(hostPort)
            this.videoSupported = this.boo.isSupported("v")
            this.audioSupported = this.boo.isSupported("a")
            this.photoSupported = this.boo.isSupported("p")
            sortViewModel.load(playState)
            this.rawMediaList = await this.boo.list(this.listRequest)

            // 前回の再生位置を復元
            let item: IMediaItem | undefined = undefined
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

  reloadPlayList() {
    logger.info("reloadPlayList")
    this.onHostChanged(settings.currentHost)
  }

  checkUpdateIfNeed() {
    if(this.boo.capabilities?.diff) {
      // リストの自動更新をサポートしている
      logger.info("checking update")
      launch(async () => {
        if (await this.boo.checkUpdate(this.rawMediaList)) {
          logger.info("checkUpdate-->need to update")
          this.reloadPlayList()
        }
      })
    }
  }

  mediaUrl(mediaItem: IMediaItem|undefined): string|undefined {
    if(!mediaItem) return undefined
    return this.boo.getItemUrl(mediaItem)
  }

  async refreshAuth(): Promise<boolean> {
    return await this.boo.noop()
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