<script lang="ts">
  import {
    ICON_PLAY,　ICON_STOP,
    ICON_NEXT, ICON_PREV,
    ICON_SKIP_NEXT,　ICON_SKIP_PREV,
    ICON_MODE_FILL, ICON_MODE_FIT, ICON_MODE_ORIGINAL,
    ICON_PIN_OFF, ICON_PIN_ON,
  } from "$lib/Icons"
  import SvgIcon from "$lib/primitive/SvgIcon.svelte"
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte"
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import IconButton from "$lib/primitive/IconButton.svelte";
  import PlayerSlider from "$lib/component/PlayerSlider.svelte";

  let pinIcon = $derived(playerViewModel.pinControlPanel ? ICON_PIN_ON : ICON_PIN_OFF)
  let fitModeIcon = $derived.by(()=>{
    switch(playerViewModel.fitMode) {
      case "fit":
        return ICON_MODE_FIT
      case "fill":
        return ICON_MODE_FILL
      case "original":
      default:
        return ICON_MODE_ORIGINAL
    }
  })

  const prev = () => {
    viewModel.prev()
  }
  const next = () => {
    viewModel.next()
  }
  const toggle = () => {
    playerViewModel.togglePlay()
  }
  const nextChapter = () => {
    playerViewModel.nextChapter()
  }
  const prevChapter = () => {
    playerViewModel.prevChapter()
  }

  const togglePin = () => {
    playerViewModel.pinControlPanel = !playerViewModel.pinControlPanel
  }
  const changeFitMode = () => {
    switch(playerViewModel.fitMode) {
      case "fit":
        playerViewModel.fitMode = "fill"
        break
      case "fill":
        playerViewModel.fitMode = "original"
        break
      case "original":
      default:
        playerViewModel.fitMode = "fit"
        break
    }
  }

</script>

<div class="relative">
  {#if playerViewModel.isAV}
    <PlayerSlider/>
  {/if}
  <!-- Left Buttons Group : 現在未使用 -->
<!--  <div class="buttons-left flex gap-2 absolute left-0 bottom-0">-->
<!--    <IconButton class="control_button rounded-none" path={ICON_PREV} onclick={prev}/>-->
<!--    <IconButton class="control_button rounded-none" path={ICON_NEXT} onclick={next}/>-->
<!--  </div>-->

  <!-- Center Buttons Group -->
  <div class="buttons-center justify-center flex flex-1 gap-2">
    <IconButton class="control-button rounded-none" path={ICON_PREV} onclick={prev}/>
    <IconButton class="control-button rounded-none" path={ICON_SKIP_PREV} onclick={prevChapter} disabled={playerViewModel.isImage}/>
    <IconButton class="control-button rounded-none" path={playerViewModel.playing?ICON_STOP:ICON_PLAY} onclick={toggle}/>
    <IconButton class="control-button rounded-none" path={ICON_SKIP_NEXT} onclick={nextChapter} disabled={playerViewModel.isImage}/>
    <IconButton class="control-button rounded-none" path={ICON_NEXT} onclick={next}/>
  </div>

  <!-- Right Buttons Group -->
  <div class="buttons-right flex gap-2 absolute right-0 bottom-0">
    <IconButton class="control-button rounded-none" path={fitModeIcon} onclick={changeFitMode}/>
    <IconButton class="control-button rounded-none" path={pinIcon} onclick={togglePin}/>
    <!-- Add more buttons as needed -->
  </div>


</div>

<style lang="scss">
</style>
