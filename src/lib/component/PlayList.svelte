<script lang="ts">
  import {emptyMediaList} from "$lib/protocol/IBooProtocol";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {formatSize, formatTime} from "$lib/utils/Utils";

  let currentId = $state("")
  function onSelect(e:MouseEvent, i:number) {
    console.log("onSelect", i)
    currentId = viewModel.mediaList.list[i].id
  }
</script>

<div class="panel">
  {#if viewModel.mediaList.list.length !== 0}
    <table>
      <tbody>
      {#each viewModel.mediaList.list as item, i (item.id)}
        <tr id={item.id}>
          <td onclick={ (e)=>onSelect(e,i) } class="cursor-pointer whitespace-nowrap font-medium text-xs common_surface ">
            <div class="px-1 py-0.5" class:selected={currentId===item.id}>
              <div  >{item.name}</div>
              <div class:text-secondary-on-alt={currentId===item.id} class:text-surface-on-alt={currentId!==item.id}>{item.duration!==undefined ? formatTime(item.duration) : formatSize(item.size) }</div>
            </div>
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
