<script lang="ts">
  import { slide, fade } from "svelte/transition";
  import {logger} from "$lib/model/DebugLog.svelte";
  import SidePanel from "$lib/panel/SidePanel.svelte";
  import TitleBar from "$lib/panel/TitleBar.svelte";
  import Player from "$lib/panel/Player.svelte";
  import DebugPanel from "$lib/panel/DebugPanel.svelte";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {onMount} from "svelte";
  import Dialog from "$lib/dialog/Dialog.svelte";
  import HostDialogContent from "$lib/dialog/HostDialogContent.svelte";
  import SystemDialogContent from "$lib/dialog/SystemDialogContent.svelte";
  import {settings} from "$lib/model/Settings.svelte";

  // import { invoke } from "@tauri-apps/api/core";
  // let name = $state("");
  // let greetMsg = $state("");
  // async function greet(event: Event) {
  //   event.preventDefault();
  //   Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  //   greetMsg = await invoke("greet", { name });
  // }
  let title = $derived(viewModel.currentItem?.name ?? "BooTauri2")

  let sidePanelShown = $state(true)
  let titleBarShown = $state(true)
  // $inspect(settings.colorVariation)


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
<main class="root-container h-screen flex flex-col bg-background {settings.colorVariation}" class:dark={settings.isDarkMode}>
  <!-- タイトルバー -->
  {#if !viewModel.fullscreenPlayer}
    <div class="title-panel h-[50px] w-full" transition:slide={{axis:'y'}}>
      <TitleBar title={title} menu={()=> sidePanelShown=!sidePanelShown}/>
    </div>
  {/if}

  <!-- コンテンツ -->
  <div class="split-container flex flex-1 overflow-hidden">
    <!-- サイドバー（リスト） -->
    {#if sidePanelShown && !viewModel.fullscreenPlayer}
      <div class="side-panel w-[250px] flex flex-col overflow-hidden" transition:slide={{axis:'x'}}>
        <SidePanel/>
      </div>
    {/if}

    <!-- プレーヤー（ビューア） -->
    <div class="main-panel flex-1 overflow-hidden">
      <Player/>
    </div>
  </div>

  <!-- デバッグログ表示パネル -->
  {#if settings.enableDebugLog}
    <div class="h-1/4 w-full" transition:slide = {{axis:'y'}}>
      <DebugPanel/>
    </div>
  {/if}

  <!-- busy表示 -->
  {#if viewModel.loading}
    <div transition:fade class="loading absolute top-0 bottom-0 left-0 right-0 h-full w-full flex items-center justify-center bg-gray text-gray-on">
      <div class="spinner fill-gray-200">Loading ...</div>
    </div>
  {/if}

  <!-- ダイアログ -->
  {#if viewModel.dialogType}
  <div transition:fade class="absolute top-0 bottom-0 right-0 left-0 h-full w-full bg-black bg-opacity-70 flex items-center justify-center">
    {#if viewModel.dialogType === "host"}
      <Dialog title="Host Settings">
        <HostDialogContent closeDialog={()=>viewModel.closeDialog()}/>
      </Dialog>
    {:else if viewModel.dialogType === "system"}
      <Dialog title="Preferences">
        <SystemDialogContent/>
      </Dialog>
    {/if}
  </div>
  {/if}

  <div class="debug-panel hidden">
    <DebugPanel/>
  </div>
</main>

<style lang="scss">
</style>
