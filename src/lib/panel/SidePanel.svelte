<script lang="ts">

import PlayList from "$lib/component/PlayList.svelte";
</script>

<div class="panel">
  <PlayList/>
</div>

<style>
  .panel {
    background-color: rgba(0,255,0,0.5);
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
  }
</style>
