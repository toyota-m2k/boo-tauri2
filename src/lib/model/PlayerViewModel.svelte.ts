import {viewModel} from "$lib/model/ViewModel.svelte";
import {logger} from "$lib/model/DebugLog.svelte";
import {launch} from "$lib/utils/Utils";

export type FitMode = "fit" | "fill" | "original"

export interface IPlayerCommands {
  play:()=>void
  pause:()=>void
  nextChapter:()=>void
  prevChapter:()=>void
}

class PlayerViewModel implements IPlayerCommands {
  fitMode: FitMode = $state("fit")

  isVideo = $derived(viewModel.currentItem?.media === "v")
  isAudio = $derived(viewModel.currentItem?.media === "a")
  isImage = $derived(viewModel.currentItem?.media === "p")
  isAV = $derived(this.isVideo || this.isAudio)

  videoSource = $derived(this.isVideo ? viewModel.mediaUrl(viewModel.currentItem) : undefined)
  audioSource = $derived(this.isAudio ? viewModel.mediaUrl(viewModel.currentItem) : undefined)
  imageSource = $derived(this.isImage ? viewModel.mediaUrl(viewModel.currentItem) : undefined)
  avSource = $derived(this.videoSource || this.audioSource)

  duration:number = $state(0)
  currentPosition = $state(0)
  safeDuration = $derived(this.duration>=0 ? this.duration : 0)
  safeCurrentPosition = $derived(this.currentPosition>=0 ? this.currentPosition : 0)
  muted = $state(false)
  autoPlay = $state(true)
  playing = $state(false)
  sliderSeeking = $state(false)
  initialSeekPosition = $state(0)
  pinControlPanel = $state(false)

  async reAuthIfNeeded() {
    await viewModel.refreshAuth()
  }

  tryReAuth() {
    launch( async ()=> {
      await this.reAuthIfNeeded()
    })
  }

  private playerCommands:IPlayerCommands|undefined = undefined

  setPlayerCommands(playerCommands:IPlayerCommands) {
    this.playerCommands = playerCommands
  }
  resetPlayerCommands(playerCommands:IPlayerCommands) {
    if(this.playerCommands === playerCommands) {
      this.playerCommands = undefined
    }
  }

  play() {
    logger.debug("play")
    this.autoPlay = true
    this.playerCommands?.play()
  }
  pause() {
    logger.debug("pause")
    this.autoPlay = false
    this.playerCommands?.pause()
  }
  togglePlay() {
    logger.debug("togglePlay")
    if(this.playing) {
      this.pause()
    }
    else {
      this.play()
    }
  }
  nextChapter() {
    this.playerCommands?.nextChapter()
  }
  prevChapter() {
    this.playerCommands?.prevChapter()
  }

}

export const playerViewModel = new PlayerViewModel()