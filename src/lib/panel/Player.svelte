<script lang="ts">

  import AVPlayer from "$lib/component/VideoPlayer.svelte"
  import {fade} from 'svelte/transition'
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
  import MediaControlPanel from "$lib/panel/MediaControlPanel.svelte";

  let showControlPanel = $state(true)

</script>

<div class="panel">
  <AVPlayer />

  {#if showControlPanel}
    <div class="absolute w-full bottom-0 div-gradient" transition:fade>
        <MediaControlPanel
        />
    </div>
  {/if}

</div>

<style>
  .panel {
    background-color: rgba(255,0,255,0.5);
    width: 100%;
    height: 100%;
  }
  .div-gradient {
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.7) 40%);
  }
</style>
