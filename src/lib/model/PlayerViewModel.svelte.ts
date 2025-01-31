import {viewModel} from "$lib/model/ViewModel.svelte";
import {logger} from "$lib/model/DebugLog.svelte";
import {settings} from "$lib/model/Settings.svelte";

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

  videoWidth = $state(0)
  videoHeight = $state(0)
  videoLandscape = $derived(this.videoWidth > this.videoHeight)
  imageWidth = $state(0)
  imageHeight = $state(0)
  imageLandscape = $derived(this.imageWidth > this.imageHeight)
  isContentLandscape = $derived(this.isVideo ? this.videoLandscape : this.imageLandscape)
  playerWidth = $state(0)
  playerHeight = $state(0)
  isPlayerLandscape = $derived(this.playerWidth > this.playerHeight)
  isRotationNeeded = $derived(settings.autoRotation && this.isContentLandscape !== this.isPlayerLandscape)
  playerDisplayWidth = $derived.by(()=>{
    if(this.fitMode==="original") {
      return "auto"
    }
    if(this.isRotationNeeded) {
      return `${this.playerWidth}px`
    } else "100%"
  })
  playerDisplayHeight = $derived.by(()=>{
    if(this.fitMode==="original") {
      return "auto"
    }
    if(this.isRotationNeeded) {
      return `${this.playerHeight}px`
    } else "100%"
  })

  videoSource = $derived(this.isVideo ? viewModel.mediaUrl(viewModel.currentItem, viewModel.token) : undefined)
  audioSource = $derived(this.isAudio ? viewModel.mediaUrl(viewModel.currentItem, viewModel.token) : undefined)
  imageSource = $derived(this.isImage ? viewModel.mediaUrl(viewModel.currentItem, viewModel.token) : undefined)

  duration:number = $state(0)
  currentPosition = $state(0)
  safeDuration = $derived(this.duration>=0 ? this.duration : 0)
  safeCurrentPosition = $derived(this.currentPosition>=0 ? this.currentPosition : 0)
  muted = $state(false)
  requestPlay = $state(true)    // 再生リクエスト
  playing = $state(false)       // 実際の再生状態
  sliderSeeking = $state(false)
  initialSeekPosition = $state(0)
  pinControlPanel = $state(false)
  repeatPlay = $state(false)    // valid only for video/audio

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
    this.requestPlay = true
    this.playerCommands?.play()
  }
  pause() {
    logger.debug("pause")
    this.requestPlay = false
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