import type {IHostInfo, ISettings, IViewModel} from "$lib/model/ModelDef";
import {emptyMediaList, type IListRequest, type IMediaItem, type IMediaList} from "$lib/protocol/IBooProtocol";
import {createBooProtocol} from "$lib/protocol/BooProtocol";
import {settings} from "$lib/model/Settings.svelte";

class ViewModel {
  static filterAll(mediaItem: IMediaItem): boolean {
    return true
  }
  static filterImage(mediaItem: IMediaItem): boolean {
    return mediaItem.media === "p"
  }
  static filterVideo(mediaItem: IMediaItem): boolean {
    return mediaItem.media === "v"
  }
  static filterAudio(mediaItem: IMediaItem): boolean {
    return mediaItem.media === "a"
  }

  private rawMediaList = $state<IMediaList>(emptyMediaList())
  acceptVideo = $state(true)
  acceptAudio = $state(true)
  acceptImage = $state(true)

  mediaList:IMediaList = $derived.by(()=>{
    return {list:this.rawMediaList.list.filter(item=>{
      switch(item.media) {
        case "v": return this.acceptVideo
        case "a": return this.acceptAudio
        case "p": return this.acceptImage
        default: return false
      }
    }), date:this.rawMediaList.date}
  })
  currentItem = $state<IMediaItem|undefined>(undefined)
  isBusy = $state(false)

  boo = createBooProtocol(()=> Promise.resolve("a"))
  private listRequest: IListRequest = {type: "all", sourceType: 1}

  isPrepared = $state(false)

  loading = $derived(this.isBusy||!this.isPrepared)

  async prepareSettings() {
    if(this.isPrepared) return
    await settings.load()
    this.isPrepared = true
  }


  async setHost(hostInfo:IHostInfo) {
    this.rawMediaList = emptyMediaList()
    this.currentItem = undefined

    this.isBusy = true
    try {
      if (await this.boo.setup(hostInfo)) {
        this.rawMediaList = await this.boo.list(this.listRequest)
        settings.currentHost = hostInfo

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
        // if(this.boo.isSupported("v")) {
        //   this.videoSupported.set(true)
        //   observers.add(disposableSubscribe(this.videoSelected, () => { this.onFilterChanged() }))
        // }
        // if(this.boo.isSupported("a")) {
        //   this.audioSupported.set(true)
        //   observers.add(disposableSubscribe(this.audioSelected, () => { this.onFilterChanged() }))
        // }
        // if(this.boo.isSupported("p")) {
        //   this.photoSupported.set(true)
        //   observers.add(disposableSubscribe(this.photoSelected, () => { this.onFilterChanged() }))
        // }
        // if(observers.count>1) {
        //   this.typeSelectable.set(true)
        // }
        return true
      } else {
        return false
      }
    } finally {
      this.isBusy = false
    }

  }
}

export const viewModel = new ViewModel()