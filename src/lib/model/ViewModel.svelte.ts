import type {IHostInfo, ISettings, IViewModel, DialogType} from "$lib/model/ModelDef";
import {emptyMediaList, type IListRequest, type IMediaItem, type IMediaList} from "$lib/protocol/IBooProtocol";
import {createBooProtocol} from "$lib/protocol/BooProtocol";
import {settings} from "$lib/model/Settings.svelte";
import {type IRange} from "$lib/model/ChapterUtils";
import {globalKeyEvents, keyFor} from "$lib/utils/KeyEvents";
import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
import {logger} from "$lib/model/DebugLog.svelte";

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

  isBusy = $state(false)

  boo = createBooProtocol(()=> Promise.resolve("a"))
  private listRequest: IListRequest = {type: "all", sourceType: 1}

  isPrepared = $state(false)

  loading = $derived(this.isBusy||!this.isPrepared)

  async prepareSettings() {
    if(this.isPrepared) return
    this.initKeyMap()
    this.initEventListeners()
    await settings.load()
    this.isPrepared = true
  }

  private initKeyMap() {
    globalKeyEvents
      .register(keyFor({key: "ArrowUp", asCode: true}, {}), () => { viewModel.prev(); return true })
      .register(keyFor({key: "ArrowDown", asCode: true}, {}), () => { viewModel.next(); return true})
      .activate()
  }
  private initEventListeners() {
    // document.addEventListener('fullscreenchange', () => {
    //   logger.info('initEventListeners')
    //   this.fullscreenPlayer = !!document.fullscreenElement;
    // })
  }



  async onHostChanged() {
    const hostInfo = settings.currentHost
    if(!hostInfo) return

    this.rawMediaList = emptyMediaList()
    this.currentItem = undefined

    this.isBusy = true
    try {
      if (await this.boo.setup(hostInfo)) {
        this.rawMediaList = await this.boo.list(this.listRequest)

        // 前回の再生位置を復元
        // let playIndex = 0
        // if(hostInfo.currentMediaId) {
        //   list.list.find((item, index) => {
        //     if(item.id === hostInfo.currentMediaId) {
        //       playIndex = index
        //       this.initialSeekPosition = hostInfo.currentMediaPosition ?? 0
        //       // logger.info(`found: ${item.id} ${playIndex} -- ${playPosition}`)
        //       return true
        //     }
        //   })
        // }
        // this.setCurrentIndex(playIndex)
        //
        // const observers = new Disposer()
        this.videoSupported = this.boo.isSupported("v")
        this.audioSupported = this.boo.isSupported("a")
        this.photoSupported = this.boo.isSupported("p")

        return true
      } else {
        return false
      }
    } finally {
      this.isBusy = false
    }

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
  }
  openSystemDialog() {
    this.dialogType = "system"
  }
  openHostDialog() {
    this.dialogType = "host"
  }

  fullscreenPlayer = $state(false)
}


export const viewModel = new ViewModel()