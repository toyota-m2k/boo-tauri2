<script lang="ts">

  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte.js";
  import {logger} from "$lib/model/DebugLog.svelte";

  let rest = $props()
  let player = $state<HTMLVideoElement>() as HTMLVideoElement;
  export function play() {
    player.play();
  }
  export function pause() {
    player.pause();
  }
  function onPlay() {
    playerViewModel.playing = true;
  }
  function onPause() {
    playerViewModel.playing = false;
  }
  function onLoaded() {
    logger.info("onLoaded")
    const pos = playerViewModel.initialSeekPosition
    if(pos>0) {
      player.currentTime = pos/1000
      playerViewModel.initialSeekPosition = 0
    }
  }
  function onError() {
    logger.error(`onError`)
    playerViewModel.tryReAuth()
  }

</script>

{#if playerViewModel.isAV}
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
{:else}
  <div>
    NO PLAYER
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