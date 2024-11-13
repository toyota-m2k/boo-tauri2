<script lang="ts">
  import {
    ICON_NEXT,
    ICON_PLAY,
    ICON_PREV,
    ICON_SKIP_NEXT,
    ICON_SKIP_PREV,
    ICON_STOP
  } from "$lib/Icons"
  import SvgIcon from "$lib/primitive/SvgIcon.svelte"
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte"
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import IconButton from "$lib/primitive/IconButton.svelte";
  import PlayerSlider from "$lib/component/PlayerSlider.svelte";
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
    <IconButton class="control-button rounded-none" path={ICON_PREV} onclick={prev}/>
    <IconButton class="control-button rounded-none" path={ICON_NEXT} onclick={next}/>
    <!-- Add more buttons as needed -->
  </div>


</div>

<style lang="scss">
</style>
