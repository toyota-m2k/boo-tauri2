<script lang="ts">

import PlayList from "$lib/component/PlayList.svelte";
import PlayListFooter from "$lib/component/PlayListFooter.svelte";
</script>

<div class="panel">
  <div class="play-list">
    <PlayList/>
  </div>
  <PlayListFooter/>
</div>

<style>
  .panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .play-list {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
  }
</style>
