<script lang="ts">

  import VideoPlayer from "$lib/component/VideoPlayer.svelte"
  import {fade} from 'svelte/transition'
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
  import MediaControlPanel from "$lib/panel/MediaControlPanel.svelte";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import ImageViewer from "$lib/component/ImageViewer.svelte";
  import {TimingSwitch} from "$lib/utils/TimingSwitch";

  function onended() {
    if(!playerViewModel.sliderSeeking) {
      viewModel.next()
    }
  }

  let lockControlPanel = $state(false)
  let mouseOnControlPanel = $state(false)
  let showControlPanel = $derived(!!viewModel.currentItem && (mouseOnControlPanel||lockControlPanel||!playerViewModel.playing))
  let controlPanelTimingSwitch = new TimingSwitch(2000, ()=>{
    mouseOnControlPanel = false
  })

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
    // logger.info(`onMouseLeave y=${e.y} offsetY  =${e.offsetY}`)
    if(mouseOnControlPanel) {
      controlPanelTimingSwitch.start()
    }
  }
  // function onMouseOut(e:MouseEvent) {
  //   logger.info("onMouseOut")
  // }
  function onMouseMoveOnPanel(e:MouseEvent) {
    // controlPanelTimingSwitch.cancel()
    // if(!mouseOnControlPanel) {
    //   mouseOnControlPanel = true
    // }
  }
</script>

<div class="panel">
  {#if playerViewModel.isVideo}
    <VideoPlayer {onended}/>
  {:else if playerViewModel.isImage}
    <ImageViewer {onended}/>
  {/if}

  <!-- マウスオーバーで、コントロールパネルを出し入れする仕掛け -->
  <div class="absolute bottom-0 left-0 right-0 h-[95px]"
       onmouseenter={onMouseEnterToPanel}
       onmousemove={onMouseMoveOnPanel}
       onmouseleave={onMouseLeaveFromPanel}
       role="none"></div>

  {#if showControlPanel}
    <div class="absolute left-0 right-0 bottom-0" transition:fade>
      <div class="w-full flex flex-col">
        <div class="w-full h-8 flex div-gradient"></div>
        <div class="bg-black w-full flex-1">
          <MediaControlPanel/>
        </div>
    </div>
    </div>
  {/if}

</div>

<style>
  .panel {
    background-color: black;
    width: 100%;
    height: 100%;
    position: relative;
  }
  .div-gradient {
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%);
  }
</style>
