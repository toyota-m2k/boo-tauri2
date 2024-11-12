<script lang="ts">
  import { slide, fade } from "svelte/transition";
  import {logger} from "$lib/model/DebugLog.svelte";
  import SidePanel from "$lib/panel/SidePanel.svelte";
  import TitleBar from "$lib/panel/TitleBar.svelte";
  import Player from "$lib/panel/Player.svelte";
  import DebugPanel from "$lib/panel/DebugPanel.svelte";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {onMount} from "svelte";
  import {settings} from "$lib/model/Settings.svelte";
  import Dialog from "$lib/dialog/Dialog.svelte";
  import HostDialogContent from "$lib/dialog/HostDialogContent.svelte";

  // import { invoke } from "@tauri-apps/api/core";
  // let name = $state("");
  // let greetMsg = $state("");
  // async function greet(event: Event) {
  //   event.preventDefault();
  //   Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  //   greetMsg = await invoke("greet", { name });
  // }
  let title = $state("BooTauri")

  let sidePanelShown = $state(true)
  let titleBarShown = $state(true)


  async function onWindowSizeChanged() {
    logger.info(`SizeChanged: w=${window.innerWidth}}`)

    // if(!Env.isTauri || !await tauriEx.isFullscreen()) {
    //   // logger.info("!tauri || !fullscreen : innerWidth=" + window.innerWidth)
    //   // 画面幅が  px以上になったらサイドパネルを表示する
    //   if (window.innerWidth >= SidePanelThreshold) {
    //     sidePanelShown = true
    //     sidePanelOverWrap = false
    //   }
    //   // 画面幅が SidePanelThreshold px未満になったらサイドパネルを非表示にする
    //   else {
    //     sidePanelShown = false
    //     sidePanelOverWrap = true
    //   }
    // }
    // updateBodyPadding()

    // if(!Env.isTauri) {
    //   eventWindowSizeChanged.emit(window.innerWidth, window.innerHeight)
    // }
  }

  onMount(async () => {
    await viewModel.prepareSettings()
    if(!settings.currentHost) {
      viewModel.openHostDialog()
    }
  })
  $effect(() => {
    if(settings.currentHost) {
      viewModel.setHost(settings.currentHost)
    }
  })

</script>

<svelte:window on:resize={onWindowSizeChanged}/>
<main class="root-container bg-background">
  <div class="title-panel">
    <TitleBar title={title} menu={()=> sidePanelShown=!sidePanelShown}/>
  </div>
  <div class="split-container">
    {#if sidePanelShown}
    <div class="side-panel" transition:slide={{axis:'x'}}>
      <SidePanel/>
    </div>
    {/if}
    <div class="main-panel">
      <Player/>
    </div>
  </div>
  {#if viewModel.loading}
    <div transition:fade class="loading absolute top-0 bottom-0 left-0 right-0 h-full w-full flex items-center justify-center bg-gray text-gray-on">
      <div class="spinner fill-gray-200">Loading ...</div>
    </div>
  {/if}

  {#if viewModel.dialogType}
  <div transition:fade class="absolute top-0 bottom-0 right-0 left-0 h-full w-full bg-black bg-opacity-70 flex items-center justify-center">
    {#if viewModel.dialogType === "host"}
      <Dialog title="Host Settings">
        <HostDialogContent closeDialog={()=>viewModel.closeDialog()}/>
      </Dialog>
    {:else if viewModel.dialogType === "system"}
      <Dialog title="Preferences">
        <div>not implemented yet</div>
      </Dialog>
    {/if}
  </div>
  {/if}

  <div class="debug-panel hidden">
    <DebugPanel/>
  </div>
</main>

<style lang="scss">
  .root-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .title-panel {
    height: 50px;
    width: 100%;
  }
  .split-container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .side-panel {
    width: 250px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

  }
  .main-panel {
    flex: 1;
    overflow: hidden;
  }
</style>
