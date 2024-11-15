<script lang="ts">
  import {logger} from "$lib/model/DebugLog.svelte";
  import IconButton from "$lib/primitive/IconButton.svelte";
  import {ICON_TRASH} from "$lib/Icons";
</script>

<div class="p-2 w-full h-full bg-white relative">
  <div class="w-full h-full overflow-y-auto">
    <div>
      {#each logger.messages as m (m.id)}
        <div class="{m.level}">{m.message}</div>
      {/each}
    </div>
  </div>
  <IconButton path={ICON_TRASH} class="absolute w-10 h-10 bottom-0 right-5 p-1 m-2 rounded hover:bg-secondary hover:text-secondary-on" onclick={()=>logger.clear()}/>
</div>

<style>
  .error {
    color: red;
  }
  .warn {
    color: orange;
  }
  .info {
    color: blue;
  }
  .debug {
    color: green;
  }
</style>
