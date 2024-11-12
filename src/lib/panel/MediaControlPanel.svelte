<script lang="ts">
  import {
    ICON_NEXT,
    ICON_PIN,
    ICON_PIN_OFF,
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
    console.log("nextChapter")
  }
  const prevChapter = () => {
    console.log("prevChapter")
  }

</script>

<div class="panel">
  <div class="buttons flex p-1 justify-center gap-2">
    <IconButton class="control_button rounded-none" path={ICON_PREV} onclick={prev}/>
    <IconButton class="control_button rounded-none" path={ICON_SKIP_PREV} onclick={prevChapter} disabled={true}/>
    <IconButton class="control_button rounded-none" path={playerViewModel.playing?ICON_STOP:ICON_PLAY} onclick={toggle}/>
    <IconButton class="control_button rounded-none" path={ICON_SKIP_NEXT} onclick={nextChapter} disabled={playerViewModel.isImage}/>
    <IconButton class="control_button rounded-none" path={ICON_NEXT} onclick={next}/>
  </div>

</div>

<style lang="postcss">
  .panel {
    background-color: rgba(255,0,255,0.5);
    width: 100%;
  }
</style>
