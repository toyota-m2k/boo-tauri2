<script lang="ts">

  import {type IPlayerCommands, playerViewModel} from "$lib/model/PlayerViewModel.svelte.js";
  import {logger} from "$lib/model/DebugLog.svelte";
  import ZoomView from "$lib/primitive/ZoomView.svelte";
  import {onMount} from "svelte";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {delay, launch} from "$lib/utils/Utils";
  import {chaptersViewModel} from "$lib/model/ChaptersViewModel.svelte";
  import {CursorConcealer} from "$lib/model/CursorConcealer.svelte";

  let rest = $props()
  let player = $state<HTMLVideoElement>() as HTMLVideoElement;
  let cursorConcealer = new CursorConcealer()
  let hideCursor = $derived(cursorConcealer.hideCursor&&playerViewModel.playing)
  let playRequested = playerViewModel.autoPlay
  let playerCommands:IPlayerCommands = {
    nextChapter: ()=>{
      chaptersViewModel.nextChapter()
    },
    prevChapter: ()=> {
      chaptersViewModel.prevChapter()
    },
    play: ()=>{
      logger.debug("VideoPlayer:play")
      playRequested = true
      let count = 0
      launch(async ()=>{
        while(count<10&&playRequested) {
          try {
            const pos = playerViewModel.currentPosition
            if(await playerViewModel.reAuthIfNeeded()) {
              playerViewModel.initialSeekPosition = pos
            }
            await player.play()
            return
          } catch (e) {
            logger.error(`play: ${e}`)
            await delay(200)
            count++
          }
        }
      })
    },
    pause: ()=> {
      logger.debug("VideoPlayer:pause")
      playRequested = false
      player.pause()
    }
  }

  // let ddd = $state(0)
  // $inspect(ddd)

  // $inspect(viewModel.currentItem?.name, playerViewModel.avSource)

  onMount(()=>{
    playerViewModel.setPlayerCommands(playerCommands)
    return ()=>{
      playerViewModel.resetPlayerCommands(playerCommands)
    }
  })

  function onPlay() {
    logger.info("onPlay")
    playerViewModel.playing = true;
  }
  function onPause() {
    logger.info("onPause")
    if(playerViewModel.isVideo) {
      playerViewModel.playing = false;
    }
  }
  function onLoadStart() {
    logger.info("onLoadStart")
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
    logger.info("onLoaded")
    const pos = playerViewModel.initialSeekPosition
    if(pos>0) {
      playerViewModel.initialSeekPosition = 0
      player.currentTime = pos
    }
  }
  function onError(e:any) {
    logger.error(`onError: ${e}`)
    playerViewModel.tryReAuth()
  }
</script>

{#if playerViewModel.isVideo}
  <ZoomView onclick={()=>playerViewModel.togglePlay()}>
    <video
      class="media-view"
      class:cursor-none={hideCursor}
      class:rotate-90={playerViewModel.isRotationNeeded}
      class:fit={playerViewModel.fitMode==="fit"}
      class:fill={playerViewModel.fitMode==="fill"}
      class:original={playerViewModel.fitMode==="original"}
      bind:this={player}
      src={playerViewModel.avSource}
      bind:videoWidth={playerViewModel.videoWidth}
      bind:videoHeight={playerViewModel.videoHeight}
      style:width={playerViewModel.playerDisplayHeight}
      style:height={playerViewModel.playerDisplayWidth}

      bind:currentTime={playerViewModel.currentPosition}
      bind:muted={playerViewModel.muted}
      onplay={onPlay}
      onpause={onPause}
      onloadstart={onLoadStart}
      onloadedmetadata={onLoadedMetaData}
      onloadeddata={onLoaded}
      onerror={onError}
      onmousemove={()=>cursorConcealer.onMouseMove()}

      {...rest}
      autoplay
    >
      <track kind="captions" src="">
    </video>
  </ZoomView>
{:else}
  <div>
    Video Player
  </div>
{/if}



<style>
  .media-view {
    max-width: none;
    max-height: none;
  }

  .media-view.fit {
    width: 100%;
    height: 100%;
    /*margin: auto; !* これによりビデオがコンテナの中央に配置されます *!*/
    object-fit: contain; /* ビデオがコンテナの幅または高さに合わせて調整されます */
  }

  .media-view.fill {
    width: 100%;
    height: 100%;
    /*margin: auto; !* これによりビデオがコンテナの中央に配置されます *!*/
    object-fit: cover; /* ビデオがコンテナの幅または高さに合わせて調整されます */
  }

  .media-view.original {
    width: auto;
    height: auto;
    /*margin: auto; !* これによりビデオがコンテナの中央に配置されます *!*/
    object-fit: cover; /* ビデオがコンテナの幅または高さに合わせて調整されます */
  }

</style>