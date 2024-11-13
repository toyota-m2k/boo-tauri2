<script lang="ts">
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
  import ZoomView from "$lib/primitive/ZoomView.svelte";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {TimingSwitch} from "$lib/utils/TimingSwitch";
  import {settings} from "$lib/model/Settings.svelte";

  let viewer: HTMLImageElement = $state() as HTMLImageElement
  let { onended }: { onended: () => void } = $props()

  $effect(() => {
    if (playerViewModel.autoPlay) {
      playerViewModel.playing = true
      let timer = new TimingSwitch(settings.slideShowInterval * 1000, () => {
        onended()
        return true
      })
      timer.start()
      return () => {
        playerViewModel.playing = false
        timer.cancel()
      }
    } else {
      playerViewModel.playing = false
    }
  })
</script>

{#if playerViewModel.isImage}
  <ZoomView onclick={()=>playerViewModel.togglePlay()}>
    <img
      bind:this={viewer}
      class="image-viewer"
      src={playerViewModel.imageSource}
      alt={viewModel.currentItem?.name ?? "noname"}
    />
  </ZoomView>
{:else}
  <div>
    Image Viewer
  </div>
{/if}