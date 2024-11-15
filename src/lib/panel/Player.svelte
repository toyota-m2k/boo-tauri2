<script lang="ts">

  import VideoPlayer from "$lib/component/VideoPlayer.svelte"
  import {fade} from 'svelte/transition'
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
  import MediaControlPanel from "$lib/panel/MediaControlPanel.svelte";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import ImageViewer from "$lib/component/ImageViewer.svelte";
  import {TimingSwitch} from "$lib/utils/TimingSwitch";
  import {logger} from "$lib/model/DebugLog.svelte";

  function onended() {
    if(!playerViewModel.sliderSeeking) {
      viewModel.next()
    }
  }

  let mouseOnControlPanel = $state(false)
  let showControlPanel = $derived(!!viewModel.currentItem && (mouseOnControlPanel||playerViewModel.pinControlPanel||!playerViewModel.playing))
  let controlPanelTimingSwitch = new TimingSwitch(2000, ()=>{
    mouseOnControlPanel = false
  })

  // $inspect(showControlPanel, mouseOnControlPanel, playerViewModel.playing)


  function onMouseEnterToPanel(/*e:MouseEvent*/) {
    // logger.info("onMouseEnter")
    controlPanelTimingSwitch.cancel()
    if(!mouseOnControlPanel) {
      mouseOnControlPanel = true
    }
  }
  // function onMouseOver(e:MouseEvent) {
  //   logger.info("onMouseOver")
  // }
  function onMouseLeaveFromPanel(e:MouseEvent) {
    logger.info(`onMouseLeave y=${e.y} offsetY  =${e.offsetY}`)
    if(mouseOnControlPanel) {
      controlPanelTimingSwitch.start()
    }
  }
</script>

<div class="media-player w-full h-full relative">
  {#if playerViewModel.isVideo}
    <VideoPlayer {onended}/>
  {:else if playerViewModel.isImage}
    <ImageViewer {onended}/>
  {/if}

  <!-- マウスオーバーで、コントロールパネルを出し入れする仕掛け -->
  <div class="absolute bottom-0 left-0 right-0 h-[56px] bg-transparent"
       onmouseenter={onMouseEnterToPanel}
       role="none"></div>

  {#if showControlPanel}
    <div class="absolute left-0 right-0 bottom-0"
         transition:fade
         onmouseleave={onMouseLeaveFromPanel}
         role="none">
      <div class="w-full flex flex-col">
        <div class="w-full h-4 flex control-panel-gradient"></div>
        <div class="control-panel w-full flex-1 p-2">
          <MediaControlPanel/>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
</style>
