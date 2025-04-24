<script lang="ts">
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
  import {onMount} from "svelte";
  import {MediaHandler} from "$lib/component/MediaHandler";
  let { onended, ...rest }: { onended: () => void } = $props()
  let player = $state<HTMLAudioElement>() as HTMLAudioElement;

  let mediaHandler = new MediaHandler("a", ()=>player, onended)
  onMount(()=>{
    return mediaHandler.onMount()
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
      onplay={()=>mediaHandler.onPlay()}
      onpause={()=>mediaHandler.onPause()}
      onloadstart={()=>mediaHandler.onLoadStart()}
      onloadedmetadata={()=>mediaHandler.onLoadedMetaData()}
      onloadeddata={()=>mediaHandler.onLoaded()}
      onerror={(e)=>mediaHandler.onError(e)}
      onended={()=>mediaHandler.onEnd()}

      {...rest}
    >
      <track kind="captions" src="">
    </audio>
{:else}
  <div>
    Video Player
  </div>
{/if}
