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

<div class="panel mb-1 mt-1">
  {#if playerViewModel.isAV}
    <PlayerSlider/>
  {/if}
  <div class="buttons flex p-1 justify-center gap-2">
    <IconButton class="control_button rounded-none" path={ICON_PREV} onclick={prev}/>
    <IconButton class="control_button rounded-none" path={ICON_SKIP_PREV} onclick={prevChapter} disabled={playerViewModel.isImage}/>
    <IconButton class="control_button rounded-none" path={playerViewModel.playing?ICON_STOP:ICON_PLAY} onclick={toggle}/>
    <IconButton class="control_button rounded-none" path={ICON_SKIP_NEXT} onclick={nextChapter} disabled={playerViewModel.isImage}/>
    <IconButton class="control_button rounded-none" path={ICON_NEXT} onclick={next}/>
  </div>

</div>

<style lang="postcss">
</style>
