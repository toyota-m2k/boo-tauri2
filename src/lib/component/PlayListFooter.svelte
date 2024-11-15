<script lang="ts">

import {settings} from "$lib/model/Settings.svelte";
import IconButton from "$lib/primitive/IconButton.svelte";
import {ICON_ALL, ICON_AUDIO, ICON_PHOTO, ICON_RELOAD, ICON_VIDEO} from "$lib/Icons";
import {viewModel} from "$lib/model/ViewModel.svelte";
import SvgIcon from "$lib/primitive/SvgIcon.svelte";
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

<div class="w-full h-[80px] flex flex-col justify-center items-center bg-primary text-primary-on">
  <div class="flex flex-row justify-center items-center">
    <IconButton path={ICON_RELOAD} class="w-7 h-7 p-0.5 mr-1 text-secondary hover:bg-secondary hover:text-secondary-on rounded" onclick={()=>viewModel.onHostChanged()}/>
    {hostName}
  </div>
  <div class="w-full flex flex-col justify-center items-center">
    {#if typeSelectable}
      <div class="flex flex-row justify-center items-center gap-0">
        <div  class:bg-secondary={all}>
          <IconButton class="w-10 h-8 p-1 border-t border-b border-r border-l" path={ICON_ALL} onclick={()=>changeType("all")}/>
        </div>
        {#if viewModel.videoSupported}
        <div class:bg-secondary={video}>
          <IconButton class="w-10 h-8 p-2 border-t border-b border-r" path={ICON_VIDEO} onclick={()=>changeType("video")}/>
        </div>
        {/if}
        {#if viewModel.photoSupported}
        <div class:bg-secondary={photo}>
          <IconButton class="w-10 h-8 p-2 border-t border-b border-r" path={ICON_PHOTO} onclick={()=>changeType("photo")}/>
        </div>
        {/if}
        {#if viewModel.audioSupported}
        <div class:bg-secondary={audio}>
          <IconButton class="w-10 h-8 p-2 border-t border-b border-r" path={ICON_AUDIO} onclick={()=>changeType("audio")}/>
        </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
</style>
