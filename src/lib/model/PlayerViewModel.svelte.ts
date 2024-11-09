import {viewModel} from "$lib/model/ViewModel.svelte";
import {logger} from "$lib/model/DebugLog.svelte";
import {launch} from "$lib/utils/Utils";

export type FitMode = "fit" | "fill" | "original"

class PlayerViewModel {
  fitMode: FitMode = $state("fill")

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
  muted = $state(false)
  playing = $state(false)
  initialSeekPosition = $state(0)

  tryReAuth() {
    launch( async ()=> {
      if (await viewModel.refreshAuth()) {
        this.generation++
      }
    })
  }
}

export const playerViewModel = new PlayerViewModel()