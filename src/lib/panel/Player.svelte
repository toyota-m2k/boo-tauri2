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
    <div class="absolute left-0 right-0 bottom-0 div-gradient" transition:fade>
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
    position: relative;
  }
  .div-gradient {
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.7) 40%);
  }
</style>
