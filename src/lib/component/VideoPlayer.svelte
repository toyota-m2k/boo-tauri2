<script lang="ts">

  import {type IPlayerCommands, playerViewModel} from "$lib/model/PlayerViewModel.svelte.js";
  import {logger} from "$lib/model/DebugLog.svelte";
  import ZoomView from "$lib/primitive/ZoomView.svelte";
  import {onMount} from "svelte";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {delay, launch} from "$lib/utils/Utils";
  import {chaptersViewModel} from "$lib/model/ChaptersViewModel.svelte";

  let rest = $props()
  let player = $state<HTMLVideoElement>() as HTMLVideoElement;
  let playRequested = playerViewModel.autoPlay
  let playerCommands:IPlayerCommands = {
    nextChapter: ()=>{
      chaptersViewModel.nextChapter()
    },
    prevChapter: ()=> {
      chaptersViewModel.prevChapter()
    },
    play: ()=>{
      playRequested = true
      let count = 0
      launch(async ()=>{
        while(count<10&&playRequested) {
          try {
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
      playRequested = false
      player.pause()
    }
  }

  $inspect(viewModel.currentItem?.name, playerViewModel.avSource)

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
  function onLoaded() {
    logger.info("onLoaded")
    const pos = playerViewModel.initialSeekPosition
    if(pos>0) {
      player.currentTime = pos/1000
      playerViewModel.initialSeekPosition = 0
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
      class:fit={playerViewModel.fitMode==="fit"}
      class:fill={playerViewModel.fitMode==="fill"}
      class:original={playerViewModel.fitMode==="original"}
      bind:this={player}
      src={playerViewModel.avSource}

      bind:duration={playerViewModel.duration}
      bind:currentTime={playerViewModel.currentPosition}
      bind:muted={playerViewModel.muted}
      onplay={onPlay}
      onpause={onPause}
      onloadeddata={onLoaded}
      onerror={onError}

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
    max-width: 100%;
    max-height: 100%;
  }

  .media-view.fit {
    width: 100%;
    height: 100%;
    margin: auto; /* これによりビデオがコンテナの中央に配置されます */
    object-fit: contain; /* ビデオがコンテナの幅または高さに合わせて調整されます */
  }

  .media-view.fill {
    width: 100%;
    height: 100%;
    margin: auto; /* これによりビデオがコンテナの中央に配置されます */
    object-fit: cover; /* ビデオがコンテナの幅または高さに合わせて調整されます */
  }

  .media-view.original {
    width: auto;
    height: auto;
    margin: auto; /* これによりビデオがコンテナの中央に配置されます */
    object-fit: cover; /* ビデオがコンテナの幅または高さに合わせて調整されます */
  }

</style>