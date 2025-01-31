<script lang="ts">
  import {type IPlayerCommands, playerViewModel} from "$lib/model/PlayerViewModel.svelte";
import {CursorConcealer} from "$lib/model/CursorConcealer.svelte";
  import {chaptersViewModel} from "$lib/model/ChaptersViewModel.svelte";
  import {logger} from "$lib/model/DebugLog.svelte";
  import {delay, launch} from "$lib/utils/Utils";
  import {onMount} from "svelte";
  import {connectionManager} from "$lib/model/ConnectionManager";
let { onended, ...rest }: { onended: () => void } = $props()
let player = $state<HTMLAudioElement>() as HTMLAudioElement;
//let cursorConcealer = new CursorConcealer()
//let hideCursor = $derived(cursorConcealer.hideCursor&&playerViewModel.playing)

let playRequested = playerViewModel.requestPlay
let playerCommands:IPlayerCommands = {
  nextChapter: ()=>{
    chaptersViewModel.nextChapter()
  },
  prevChapter: ()=> {
    chaptersViewModel.prevChapter()
  },
  play: ()=>{
    logger.debug("AudioPlayer:play")
    playRequested = true
    let count = 0
    launch(async ()=>{
      await player.play()
      // while(count<10&&playRequested) {
      //   try {
      //     const pos = playerViewModel.currentPosition
      //     if(await playerViewModel.reAuthIfNeeded()) {
      //       playerViewModel.initialSeekPosition = pos
      //     }
      //     await player.play()
      //     return
      //   } catch (e) {
      //     logger.error(`play: ${e}`)
      //     await delay(200)
      //     count++
      //   }
      // }
    })
  },
  pause: ()=> {
    logger.debug("VideoPlayer:pause")
    playRequested = false
    player.pause()
  }
}

function onPlay() {
  logger.info("audio:onPlay")
  playerViewModel.playing = true;
}
function onPause() {
  logger.info("audio:onPause")
  if(playerViewModel.isAudio) {
    playerViewModel.playing = false;
  }
}
function onLoadStart() {
  logger.info("audio:onLoadStart")
  playerViewModel.currentPosition = 0
  playerViewModel.duration = 0
}
function onLoadedMetaData() {
  logger.info("onLoadedMetaData")

  // Durationはバインドしないで、onloadedmetadataで設定する。
  // そうしないと、ランタイムに、
  // [svelte] assignment_value_stale Assignment to `duration` property (src/​lib/​component/​VideoPlayer.svelte:101:21) will evaluate to the right-hand side, not the value of `duration` following the assignment. This may result in unexpected behaviour.
  // というワーニングが出る。（つまり、
  playerViewModel.duration = player?.duration || 0;
}
function onLoaded() {
  logger.info("audio:onLoaded")
  const pos = playerViewModel.initialSeekPosition
  if(pos>0) {
    playerViewModel.initialSeekPosition = 0
    player.currentTime = pos
  }
}
function onEnd() {
  logger.info("audio:onEnd")
  if(playerViewModel.repeatPlay && !playerViewModel.sliderSeeking) {
    playerViewModel.currentPosition = 0
    player.play()
  } else {
    onended()
  }
}
function onError(e:any) {
  logger.error(`audio:onError: ${e}`)
  connectionManager.recover()
}
function onMouseMove() {
  // cursorConcealer.onMouseMove()
}
onMount(()=>{
  playerViewModel.setPlayerCommands(playerCommands)
  return ()=>{
    playerViewModel.resetPlayerCommands(playerCommands)
  }
})

</script>

{#if playerViewModel.isAudio}
  <audio
      class="media-view w-full h-full"
      bind:this={player}
      src={playerViewModel.audioSource}
      style:width={playerViewModel.playerDisplayHeight}
      style:height={playerViewModel.playerDisplayWidth}

      bind:currentTime={playerViewModel.currentPosition}
      onplay={onPlay}
      onpause={onPause}
      onloadstart={onLoadStart}
      onloadedmetadata={onLoadedMetaData}
      onloadeddata={onLoaded}
      onerror={onError}
      onmousemove={onMouseMove}
      onended={onEnd}

      {...rest}
      autoplay
    >
      <track kind="captions" src="">
    </audio>
{:else}
  <div>
    Video Player
  </div>
{/if}
