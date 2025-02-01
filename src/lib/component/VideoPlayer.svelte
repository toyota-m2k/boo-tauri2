<script lang="ts">
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte.js";
  import ZoomView from "$lib/primitive/ZoomView.svelte";
  import {onMount} from "svelte";
  import {CursorConcealer} from "$lib/model/CursorConcealer.svelte";
  import {MediaHandler} from "$lib/component/MediaHandler";

  let { onended, ...rest }: { onended: () => void } = $props()
  let player = $state<HTMLVideoElement>() as HTMLVideoElement;
  let cursorConcealer = new CursorConcealer()
  let hideCursor = $derived(cursorConcealer.hideCursor&&playerViewModel.playing)

  let mediaHandler = new MediaHandler("v", ()=>player, onended)

  onMount(()=>{
    return mediaHandler.onMount()
  })

</script>

{#if playerViewModel.isVideo}
  <ZoomView>
    <video
      class="media-view"
      class:cursor-none={hideCursor}
      class:rotate-90={playerViewModel.isRotationNeeded}
      class:fit={playerViewModel.fitMode==="fit"}
      class:fill={playerViewModel.fitMode==="fill"}
      class:original={playerViewModel.fitMode==="original"}
      bind:this={player}
      src={playerViewModel.videoSource}
      bind:videoWidth={playerViewModel.videoWidth}
      bind:videoHeight={playerViewModel.videoHeight}
      style:width={playerViewModel.playerDisplayHeight}
      style:height={playerViewModel.playerDisplayWidth}

      bind:currentTime={playerViewModel.currentPosition}
      bind:muted={playerViewModel.muted}
      onplay={()=>mediaHandler.onPlay()}
      onpause={()=>mediaHandler.onPause()}
      onloadstart={()=>mediaHandler.onLoadStart()}
      onloadedmetadata={()=>mediaHandler.onLoadedMetaData()}
      onloadeddata={()=>mediaHandler.onLoaded()}
      onerror={(e)=>mediaHandler.onError(e)}
      onended={()=>mediaHandler.onEnd()}
      onmousemove={()=>cursorConcealer.onMouseMove()}

      {...rest}
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