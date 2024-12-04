<script lang="ts">
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
  import ZoomView from "$lib/primitive/ZoomView.svelte";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {TimingSwitch} from "$lib/utils/TimingSwitch";
  import {settings} from "$lib/model/Settings.svelte";
  import {CursorConcealer} from "$lib/model/CursorConcealer.svelte";

  let viewer: HTMLImageElement = $state() as HTMLImageElement
  let { onended }: { onended: () => void } = $props()
  let cursorConcealer = new CursorConcealer()
  let hideCursor = $derived(cursorConcealer.hideCursor&&playerViewModel.playing)

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
      class="media-view"
      class:cursor-none={hideCursor}
      class:fit={playerViewModel.fitMode==="fit"}
      class:fill={playerViewModel.fitMode==="fill"}
      class:original={playerViewModel.fitMode==="original"}
      src={playerViewModel.imageSource}
      alt={viewModel.currentItem?.name ?? "noname"}
      onmousemove={()=>cursorConcealer.onMouseMove()}
    />
  </ZoomView>
{:else}
  <div>
    Image Viewer
  </div>
{/if}

<style>
  .media-view {
    max-width: 100%;
    max-height: 100%;
  }

  .media-view.fit {
    width: 100%;
    height: 100%;
    margin: auto; /* これによりビデオがコンテナの中央に配置されます */
    object-fit: contain; /* ビデオがコンテナの幅または高さに合わせて調整されます */
  }

  .media-view.fill {
    width: 100%;
    height: 100%;
    margin: auto; /* これによりビデオがコンテナの中央に配置されます */
    object-fit: cover; /* ビデオがコンテナの幅または高さに合わせて調整されます */
  }

  .media-view.original {
    width: auto;
    height: auto;
    margin: auto; /* これによりビデオがコンテナの中央に配置されます */
    object-fit: cover; /* ビデオがコンテナの幅または高さに合わせて調整されます */
  }

</style>