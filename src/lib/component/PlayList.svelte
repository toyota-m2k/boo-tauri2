<script lang="ts">
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {formatSize, formatTime} from "$lib/utils/Utils";
  import {onMount, tick} from "svelte";
  import {sortViewModel} from "$lib/model/SortViewModel.svelte";

  let currentId = $derived(viewModel.currentItem?.id)

  function ensureVisible(itemId:string|undefined) {
    if(itemId) {
      tick().then(()=>{
        const el = document.getElementById(itemId)
        if(el) {
          el.scrollIntoView({block: "nearest", inline: "nearest", behavior: "smooth"})
        }
      })
    }
  }

  $effect(()=>{
    ensureVisible(currentId)
  })

  function onSelect(e:MouseEvent, i:number) {
    console.log("onSelect", i)
    viewModel.currentItem = viewModel.mediaList.list[i]
    // viewModel.checkUpdateIfNeed()
  }

  onMount(()=>{
    viewModel.scrollToItem = ensureVisible
    return ()=>{
      viewModel.scrollToItem = undefined
    }
  })
</script>

<div class="panel w-full h-full">
  {#if viewModel.mediaList.list.length !== 0}
    <table class="w-full">
      <tbody>
      {#each viewModel.mediaList.list as item, i (item.id)}
        <tr id={item.id}>
          <td onclick={ (e)=>onSelect(e,i) } class="cursor-pointer whitespace-nowrap font-medium text-xs">
            {#if currentId===item.id}
              <div class="px-1 py-0.5 bg-secondary">
                <div class="text-secondary-on">{item.name}</div>
                <div class="text-secondary-on-alt">{(item.duration!==undefined && sortViewModel.sortKey!=="size") ? formatTime(item.duration) : formatSize(item.size) }</div>
              </div>
            {:else}
              <div class="px-1 py-0.5 bg-surface">
                <div class="text-surface-on">{item.name}</div>
                <div class="text-surface-on-alt">{(item.duration!==undefined && sortViewModel.sortKey!=="size") ? formatTime(item.duration) : formatSize(item.size) }</div>
              </div>
            {/if}
          </td>
        </tr>
        <!--      <div role="button" tabindex="0" on:click={ ()=>viewModel.setCurrentIndex(i) }>{item.name} ({item.duration})</div>-->
      {/each}
      </tbody>
    </table>
  {:else}
    <div class="text-surface-on">No media found</div>
  {/if}

</div>

<style>
</style>
