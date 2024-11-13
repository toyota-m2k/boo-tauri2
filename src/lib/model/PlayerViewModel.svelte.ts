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
  generation = $state(0)  // 再認証によってurlが変わったときに、$derived（*Source） の値を再評価させるためのカウンタ

  videoSource = $derived(this.isVideo ? viewModel.mediaUrl(viewModel.currentItem, this.generation) : undefined)
  audioSource = $derived(this.isAudio ? viewModel.mediaUrl(viewModel.currentItem, this.generation) : undefined)
  imageSource = $derived(this.isImage ? viewModel.mediaUrl(viewModel.currentItem, this.generation) : undefined)
  avSource = $derived(this.videoSource || this.audioSource)

  duration = $state(0)
  currentPosition = $state(0)
  safeDuration = $derived(this.duration>=0 ? this.duration : 0)
  safeCurrentPosition = $derived(this.currentPosition>=0 ? this.currentPosition : 0)
  muted = $state(false)
  autoPlay = $state(true)
  playing = $state(false)
  sliderSeeking = $state(false)
  initialSeekPosition = $state(0)

  tryReAuth() {
    launch( async ()=> {
      const item = viewModel.currentItem
      viewModel.currentItem = undefined
      if (await viewModel.refreshAuth()) {
        viewModel.currentItem = item
        this.generation++
      }
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
    this.autoPlay = true
    this.playerCommands?.play()
  }
  pause() {
    this.autoPlay = false
    this.playerCommands?.pause()
  }
  togglePlay() {
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