<script lang="ts">

import {settings} from "$lib/model/Settings.svelte";
import IconButton from "$lib/primitive/IconButton.svelte";
import {
  ICON_ALL,
  ICON_AUDIO,
  ICON_PHOTO,
  ICON_RELOAD,
  ICON_SORT,
  ICON_SORT_ASC,
  ICON_SORT_DESC,
  ICON_VIDEO
} from "$lib/Icons";
import {viewModel} from "$lib/model/ViewModel.svelte";
import SvgIcon from "$lib/primitive/SvgIcon.svelte";
import Viewbox from "$lib/primitive/Viewbox.svelte";
import {logger} from "$lib/model/DebugLog.svelte";
import {tick} from "svelte";
import {sortViewModel} from "$lib/model/SortViewModel.svelte";
import {dialogViewModel} from "$lib/dialog/DialogViewModel.svelte";
let hostName = $derived(settings.currentHost?.displayName ?? "---")
let typeSelectable = $derived.by(()=>{
  let c = 0
  if(viewModel.videoSupported) c++
  if(viewModel.audioSupported) c++
  if(viewModel.photoSupported) c++
  return c > 1
})
let all = $derived(viewModel.acceptVideo && viewModel.acceptAudio && viewModel.acceptPhoto)
let video = $derived(viewModel.acceptVideo && !all)
let audio = $derived(viewModel.acceptAudio && !all)
let photo = $derived(viewModel.acceptPhoto && !all)

let sortIcon = $derived((sortViewModel.descending) ? ICON_SORT_DESC : ICON_SORT_ASC)
function sortSettings(e:MouseEvent) {
  logger.debug("sortSettings")
  e.preventDefault()
  e.stopPropagation()
  dialogViewModel.openSortDialog()
}
function toggleSortOrder(_:MouseEvent) {
  sortViewModel.update({descending:!sortViewModel.descending})
}

$inspect(dialogViewModel.showSortDialog)

function changeType(type:string) {
  switch(type) {
    case "all":
      viewModel.acceptVideo = true
      viewModel.acceptAudio = true
      viewModel.acceptPhoto = true
      break
    case "video":
      viewModel.acceptVideo = true
      viewModel.acceptAudio = false
      viewModel.acceptPhoto = false
      break
    case "audio":
      viewModel.acceptVideo = false
      viewModel.acceptAudio = true
      viewModel.acceptPhoto = false
      break
    case "photo":
      viewModel.acceptVideo = false
      viewModel.acceptAudio = false
      viewModel.acceptPhoto = true
      break
  }
}
</script>

<div class="w-full pt-1 pb-2 flex flex-col justify-center items-center bg-primary text-primary-on">
  <div class="w-full flex flex-row justify-center items-center">
    <IconButton path={ICON_RELOAD} class="w-7 h-7 p-0.5 mr-1 text-secondary hover:bg-secondary hover:text-secondary-on rounded-sm" onclick={()=>viewModel.reloadPlayList()}/>
    <div class="max-w-[180px] overflow-hidden">
      {hostName}
    </div>
    <IconButton path={sortIcon} class="flex w-7 h-7 p-0.5 ml-1 text-secondary hover:bg-secondary hover:text-secondary-on rounded-sm" onclick={toggleSortOrder} oncontextmenu={sortSettings} />
  </div>
  <div class="w-full flex flex-col justify-center items-center">
    {#if typeSelectable}
      <div class="flex flex-row justify-center items-center gap-0 mt-1">
        <div  class:bg-secondary={all} class:text-secondary-on={all}>
          <IconButton class="w-10 h-8 p-1 border-t border-b border-r border-l" path={ICON_ALL} onclick={()=>changeType("all")}/>
        </div>
        {#if viewModel.videoSupported}
        <div class:bg-secondary={video} class:text-secondary-on={video}>
          <IconButton class="w-10 h-8 p-2 border-t border-b border-r" path={ICON_VIDEO} onclick={()=>changeType("video")}/>
        </div>
        {/if}
        {#if viewModel.photoSupported}
        <div class:bg-secondary={photo} class:text-secondary-on={photo}>
          <IconButton class="w-10 h-8 p-2 border-t border-b border-r" path={ICON_PHOTO} onclick={()=>changeType("photo")}/>
        </div>
        {/if}
        {#if viewModel.audioSupported}
        <div class:bg-secondary={audio} class:text-secondary-on={audio}>
          <IconButton class="w-10 h-8 p-2 border-t border-b border-r" path={ICON_AUDIO} onclick={()=>changeType("audio")}/>
        </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
</style>
