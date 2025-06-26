<script lang="ts">
  import {updateList} from "$lib/model/UpdateList.svelte";

  function onOk() {
    updateList.clearUpdates()
  }
</script>

<div class="w-full flex flex-col">
  <div class="flex-1">
    {#if updateList.hasUpdates}
      <div class="p-2">
        <h2 class="text-lg font-bold">New Arrival</h2>
        <div class="mt-2 max-h-80 max-w-2xl truncate overflow-x-hidden overflow-y-auto bg-background text-background-on rounded border">
          {#each updateList.getUpdates() as update}
            <div class="py-1">{update.name}</div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="p-2 text-center">No updates available.</div>
    {/if}
  </div>
  <div class="flex justify-end p-2">
    <button class="btn btn-primary" onclick={() => onOk()}>Close</button>
  </div>
</div>