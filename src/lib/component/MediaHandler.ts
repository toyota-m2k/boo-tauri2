import {type IPlayerCommands, playerViewModel} from "$lib/model/PlayerViewModel.svelte";
import {chaptersViewModel} from "$lib/model/ChaptersViewModel.svelte";
import {logger} from "$lib/model/DebugLog.svelte";
import {launch} from "$lib/utils/Utils";
import {connectionManager} from "$lib/model/ConnectionManager";
import type {MediaType} from "$lib/protocol/IBooProtocol";
import {viewModel} from "$lib/model/ViewModel.svelte";

export class MediaHandler {
  constructor(private mediaType:MediaType, private getPlayer:()=>HTMLMediaElement, private onended:()=>void) {}
  private get player() {
    return this.getPlayer()
  }
  private get isMyType() {
    return this.mediaType === viewModel.currentItem?.media
  }
  private playerCommands:IPlayerCommands = {
    nextChapter: ()=>{
      chaptersViewModel.nextChapter()
    },
    prevChapter: ()=> {
      chaptersViewModel.prevChapter()
    },
    play: ()=>{
      logger.debug(`${this.mediaType}:play`)
      launch(async ()=>{
        await this.player.play()
      })
    },
    pause: ()=> {
      logger.debug(`${this.mediaType}:pause`)
      this.player.pause()
    }
  }

  onMount() {
    playerViewModel.setPlayerCommands(this.playerCommands)
    return ()=>{
      playerViewModel.resetPlayerCommands(this.playerCommands)
    }
  }
  onPlay() {
    logger.info(`${this.mediaType}:onPlay`)
    if(this.isMyType) {
      playerViewModel.playing = true
    }
  }
  onPause() {
    logger.info(`${this.mediaType}:onPause`)
    if(this.isMyType) {
      playerViewModel.playing = false
    }
  }
  onLoadStart() {
    logger.info(`${this.mediaType}:onLoadStart`)
    playerViewModel.currentPosition = 0
    playerViewModel.duration = 0
  }
  onLoadedMetaData() {
    logger.info("onLoadedMetaData")

    // Durationはバインドしないで、onloadedmetadataで設定する。
    // そうしないと、ランタイムに、
    // [svelte] assignment_value_stale Assignment to `duration` property (src/​lib/​component/​VideoPlayer.svelte:101:21) will evaluate to the right-hand side, not the value of `duration` following the assignment. This may result in unexpected behaviour.
    // というワーニングが出る。（つまり、
    playerViewModel.duration = this.player?.duration || 0
  }
  onLoaded() {
    logger.info(`${this.mediaType}:onLoaded`)
    const pos = playerViewModel.initialSeekPosition
    if(pos>0) {
      playerViewModel.initialSeekPosition = 0
      this.player.currentTime = pos
    }
    if(playerViewModel.playRequested) {
      playerViewModel.play()
    }
  }
  onEnd() {
    logger.info(`audio:onEnd`)
    if(playerViewModel.repeatPlay && !playerViewModel.sliderSeeking) {
      playerViewModel.currentPosition = 0
      launch(()=>this.player.play())
    } else {
      this.onended()
    }
  }
  onError(e:any) {
    logger.error(`audio:onError: ${e}`)
    connectionManager.recover()
  }

}