<script lang="ts">
  import {emptyMediaList} from "$lib/protocol/IBooProtocol";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {formatSize, formatTime} from "$lib/utils/Utils";
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";

  let currentId = $derived(viewModel.currentItem?.id)

  function onSelect(e:MouseEvent, i:number) {
    console.log("onSelect", i)
    viewModel.currentItem = viewModel.mediaList.list[i]
  }
</script>

<div class="panel">
  {#if viewModel.mediaList.list.length !== 0}
    <table>
      <tbody>
      {#each viewModel.mediaList.list as item, i (item.id)}
        <tr id={item.id}>
          <td onclick={ (e)=>onSelect(e,i) } class="cursor-pointer whitespace-nowrap font-medium text-xs">
            {#if currentId===item.id}
              <div class="px-1 py-0.5 bg-secondary">
                <div class="text-secondary-on">{item.name}</div>
                <div class="text-secondary-on-alt">{item.duration!==undefined ? formatTime(item.duration) : formatSize(item.size) }</div>
              </div>
            {:else}
              <div class="px-1 py-0.5 bg-surface">
                <div class="text-surface-on">{item.name}</div>
                <div class="text-surface-on-alt">{item.duration!==undefined ? formatTime(item.duration) : formatSize(item.size) }</div>
              </div>
            {/if}
          </td>
        </tr>
        <!--      <div role="button" tabindex="0" on:click={ ()=>viewModel.setCurrentIndex(i) }>{item.name} ({item.duration})</div>-->
      {/each}
      </tbody>
    </table>
  {:else}
    <div>No media found</div>
  {/if}

</div>

<style>
  .panel {
    width: 100%;
    height: 100%;
  }
</style>
