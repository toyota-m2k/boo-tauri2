<script lang="ts">
  import IconButton from "$lib/primitive/IconButton.svelte";
  import {ICON_CHECK, ICON_EDIT, ICON_PLUS, ICON_QR_CODE, ICON_TRASH} from "$lib/Icons";
  import {settings} from "$lib/model/Settings.svelte";
  import SvgIcon from "$lib/primitive/SvgIcon.svelte";
  import type {IHostInfo} from "$lib/model/ModelDef";
  import {isEqualHostPort} from "$lib/model/ModelDef.js";
  import Dialog from "$lib/dialog/Dialog.svelte";
  import {tauriObject} from "$lib/tauri/TauriObject";
  import {onDestroy, onMount} from "svelte";
  import {logger} from "$lib/model/DebugLog.svelte";
  import {hostDiscovery} from "$lib/model/HostDiscovery.svelte";
  import {type IDiscoveredService} from "$lib/tauri/TauriMdns";
  import {formatPairingDisplayName, parsePairingUri, pairingToHostInfo} from "$lib/protocol/PairingUri";
  import {Format, scan, cancel, checkPermissions, requestPermissions} from "@tauri-apps/plugin-barcode-scanner";

  let { show=$bindable() }:{show:boolean} = $props()
  let editingHost = $state(false)
  let targetHost: IHostInfo|undefined = $state()
  const title:string = (tauriObject.isAvailable && tauriObject.appVersion) ? "Hosts - v"+ tauriObject.appVersion : "Hosts"
  const isMobile = $derived(tauriObject.isAvailable && !tauriObject.desktop)

  function stopPropagation(e:MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
  }

  function deleteHost(e:MouseEvent, host:IHostInfo) {
    stopPropagation(e)
    settings.hostInfoList.remove(host)
    settings.saveHostList()
  }

  let newDisplayName = $state("")
  let newHostAddress = $state("")
  let newHostPort = $state(3500)
  let newUseSSL = $state(false)
  let newFingerprint = $state<string|undefined>(undefined)
  let newServiceName = $state<string|undefined>(undefined)
  let newHostname = $state<string|undefined>(undefined)
  let pairingError = $state("")
  let isScanning = $state(false)

  // QR スキャン中は WebView 背景を透明化、アプリ本体 UI は非表示化、Cancel ボタンだけ可視にする。
  // $effect だと scan() の reject 経由でフリップする際に CSS 反映が一拍遅れることがあるため、
  // 直接 classList 操作する helper を用意して同期的に呼ぶ。
  function setScanning(active: boolean) {
    isScanning = active
    if (typeof document === "undefined") return
    if (active) {
      document.body.classList.add("barcode-scanner-active")
    } else {
      document.body.classList.remove("barcode-scanner-active")
    }
  }

  function editHost(e:MouseEvent, host:IHostInfo|undefined, addHost:boolean=false) {
    stopPropagation(e)
    if(!addHost) {
      targetHost = host
    }
    newDisplayName = host?.displayName ?? ""
    newHostAddress = host?.host ?? ""
    newHostPort = host?.port ?? 3500
    newUseSSL = host?.useSSL ?? false
    newFingerprint = host?.fingerprint
    newServiceName = host?.serviceName
    newHostname = host?.hostname
    pairingError = ""
    editingHost = true
  }
  function addHost(e:MouseEvent) {
    editHost(e,settings.currentHost, true)
  }
  function endEdit(e:MouseEvent, apply:boolean) {
    stopPropagation(e)
    if(apply) {
      if(targetHost) {
        settings.hostInfoList.update(targetHost, newDisplayName)
      } else {
        settings.hostInfoList.add({
          displayName: newDisplayName,
          host: newHostAddress,
          port: newHostPort,
          useSSL: newUseSSL ?? false,
          fingerprint: newFingerprint,
          serviceName: newServiceName,
          hostname: newHostname,
        })
      }
      settings.saveHostList()
    }
    targetHost = undefined
    editingHost = false
  }
  function isCurrent(host:IHostInfo) {
    return isEqualHostPort(settings.currentHost, host)
  }
  function setCurrent(e:MouseEvent, host:IHostInfo) {
    stopPropagation(e)
    settings.currentHost = host
    show = false
  }

  function applyPairing(content: string) {
    const p = parsePairingUri(content)
    if (!p) {
      pairingError = "Scanned content is not a valid pairing URL"
      return
    }
    const info = pairingToHostInfo(p)
    newDisplayName = info.displayName
    newHostAddress = info.host
    newHostPort = info.port
    newUseSSL = info.useSSL ?? false
    newFingerprint = info.fingerprint
    newServiceName = info.serviceName
    newHostname = info.hostname
  }

  function selectDiscovered(e:MouseEvent, svc:IDiscoveredService) {
    stopPropagation(e)
    // mDNS Service Instance 名はサーバー側で "<serverName>@<machineName>" 形式に作られている
    // (例: "BooTube@MY-PC")。Display name にはそのまま流用する。
    newDisplayName = svc.serviceName
    newHostAddress = svc.host
    newHostPort = svc.port
    newUseSSL = svc.useSSL ?? false
    newFingerprint = svc.fingerprint
    newServiceName = svc.serviceName
    newHostname = svc.hostname
  }

  async function ensureCameraPermission(): Promise<boolean> {
    let state = await checkPermissions()
    if (state !== "granted") {
      state = await requestPermissions()
    }
    return state === "granted"
  }

  async function scanQR(e:MouseEvent) {
    stopPropagation(e)
    pairingError = ""
    try {
      if (!(await ensureCameraPermission())) {
        pairingError = "Camera permission was denied. Please enable it in system settings."
        return
      }
      setScanning(true)
      const result = await scan({windowed: true, formats: [Format.QRCode]})
      const content = result?.content
      if (!content) return // user cancelled
      applyPairing(content)
    } catch (err: any) {
      const msg = err?.message ?? `${err}`
      // ユーザーがキャンセルした場合は静かに戻る (エラー扱いしない)
      if (/cancel/i.test(msg)) return
      logger.error(`QR scan failed: ${err}`)
      pairingError = `QR scan failed: ${msg}`
    } finally {
      setScanning(false)
    }
  }

  async function cancelScan(e:MouseEvent) {
    stopPropagation(e)
    // 楽観的に UI を即時クリーンアップ (scan() の reject 経由を待たない)。
    // これで body のクラス除去と overlay の {#if} 除去が同期的に走る。
    setScanning(false)
    try {
      await cancel()
    } catch (err) {
      logger.error(`cancel scan failed: ${err}`)
    }
  }

  onMount(()=>{
    logger.info("HostDialogContent:mount")
    return ()=>{logger.info("HostDialogContent:unmount")}
  })
  onDestroy(()=> {
    logger.info("HostDialogContent:destroy")
    // unmount 時に scan 用 CSS クラスが残らないように防御
    if (typeof document !== "undefined") {
      document.body.classList.remove("barcode-scanner-active")
    }
  })
</script>

<Dialog {title} action={(reason)=>{if(reason==="close"||reason==="negative"){show=false}}}>
  {#snippet children()}
  <div class="flex flex-col items-center justify-center">
    {#if !editingHost}
      <div class="flex flex-col mt-2 w-4/5">
        {#each settings.hostInfoList.list as host}
          <div class="flex flex-row items-center justify-center p-2 border-b border-gray">
            <div class="flex flex-row flex-1 items-center justify-center cursor-pointer" onclick={(e)=>setCurrent(e,host)} role="none">
              <div class="flex w-7 h-7 mr-2">
                {#if isCurrent(host)}
                  <SvgIcon class="text-accent" path={ICON_CHECK}/>
                {/if}
              </div>
              <div class="flex-1 flex-col">
                <div class="text-sm text-gray-on">{host.displayName}{#if host.useSSL}<span class="ml-2 text-xs text-accent">SSL</span>{/if}</div>
                <div class="text-xs text-gray-on-alt">{host.host}:{host.port}</div>
              </div>
            </div>
            <IconButton class="p-1 w-8 h-8 rounded-sm text-secondary hover:bg-secondary hover:text-secondary-on" onclick={(e)=>editHost(e,host)} path={ICON_EDIT}/>
            <IconButton class="p-1 w-8 h-8 rounded-sm text-secondary hover:bg-secondary hover:text-secondary-on" onclick={(e)=>deleteHost(e,host)} path={ICON_TRASH}/>
          </div>
        {/each}
      </div>
      <div class="flex flex-row-reverse w-4/5">
        <IconButton class="p-1 w-6 h-6 rounded-sm text-secondary hover:bg-secondary hover:text-secondary-on" onclick={(e)=>addHost(e)} path={ICON_PLUS}/>
        <div class="mr-2">Hosts</div>
      </div>
    {:else}
      <div class="flex flex-col w-4/5">
        {#if !targetHost}
          <!-- Discovered servers (mDNS) + QR scan button (mobile) -->
          <div class="flex flex-row items-center mb-1">
            <div class="text-sm font-semibold flex-1">Discovered servers</div>
            {#if isMobile}
              <IconButton class="p-1 w-7 h-7 rounded-sm text-secondary hover:bg-secondary hover:text-secondary-on" onclick={scanQR} path={ICON_QR_CODE}/>
            {/if}
          </div>
          <div class="flex flex-col mb-3 border border-gray rounded-sm max-h-32 overflow-y-auto">
            {#if hostDiscovery.services.length === 0}
              <div class="text-xs text-gray-on-alt p-2">{hostDiscovery.isScanning ? "Scanning..." : "No servers found"}</div>
            {:else}
              {#each hostDiscovery.services as svc}
                <button class="text-left p-2 hover:bg-secondary hover:text-secondary-on border-b border-gray" onclick={(e)=>selectDiscovered(e,svc)}>
                  <div class="text-sm">{svc.serviceName}{#if svc.useSSL}<span class="ml-2 text-xs text-accent">SSL</span>{/if}</div>
                  <div class="text-xs text-gray-on-alt">{svc.host}:{svc.port}{#if svc.app}<span class="ml-1">({svc.app})</span>{/if}</div>
                </button>
              {/each}
            {/if}
          </div>
          {#if pairingError}
            <div class="text-xs text-red-500 mb-2">{pairingError}</div>
          {/if}
        {/if}

        <div>Display name</div>
        <input type="text" bind:value={newDisplayName} placeholder="Display name" class="mb-2" />
        {#if targetHost}
          <div>Address</div>
          <div>{newHostAddress}</div>
          <div>Port</div>
          <div>{newHostPort}</div>
          {#if newUseSSL}
            <div class="mt-1 text-xs text-accent">SSL enabled</div>
          {/if}
        {:else}
          <div>Address</div>
          <input type="text" bind:value={newHostAddress} placeholder="IP Address" class="mb-2"/>
          <div>Port</div>
          <input type="number" bind:value={newHostPort} placeholder="Port" class="mb-2" />
          <label class="flex flex-row items-center mt-1 mb-2">
            <input type="checkbox" bind:checked={newUseSSL} class="mr-2" />
            <span>Use SSL (https)</span>
          </label>
        {/if}

        <div class="flex flex-row items-center justify-center mt-4">
          <button class="text-button mr-4 w-20" onclick={(e)=>endEdit(e,true)}>{targetHost?"Apply":"Add"}</button>
          <button class="text-button w-20" onclick={(e)=>endEdit(e,false)}>Cancel</button>
        </div>
      </div>
    {/if}
  </div>
  {/snippet}
</Dialog>

{#if isScanning}
  <!-- カメラ プレビュー上のオーバーレイ。WebView 自体が透明化されており、
       body.barcode-scanner-active のスタイルで他の UI は visibility:hidden になっている。
       この要素 (と子) だけが visibility:visible で残る。 -->
  <div class="barcode-scanner-overlay">
    <div class="scanner-guide"></div>
    <div class="scanner-instruction">Aim at the QR code</div>
    <button class="scanner-cancel" onclick={cancelScan}>Cancel</button>
  </div>
{/if}

<style>
  /* QR スキャン中: WebView 背景を透明化、本体 UI 全て非表示にしてカメラだけ見せる。
     visibility:hidden は子要素にも継承するが、子側で visible !important すれば上書きできる。 */
  :global(html.barcode-scanner-active),
  :global(body.barcode-scanner-active) {
    background: transparent !important;
  }
  :global(body.barcode-scanner-active > *) {
    visibility: hidden !important;
  }
  :global(body.barcode-scanner-active .barcode-scanner-overlay),
  :global(body.barcode-scanner-active .barcode-scanner-overlay *) {
    visibility: visible !important;
  }

  .barcode-scanner-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 4rem 2rem;
    pointer-events: none;
  }
  .scanner-guide {
    width: 70vmin;
    height: 70vmin;
    border: 3px solid rgba(255, 255, 255, 0.8);
    border-radius: 16px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.35);
    margin-top: 4rem;
  }
  .scanner-instruction {
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 14px;
  }
  .scanner-cancel {
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    padding: 12px 36px;
    border-radius: 28px;
    font-size: 16px;
    pointer-events: auto;
    border: none;
    cursor: pointer;
  }
  .scanner-cancel:active {
    background: rgba(0, 0, 0, 0.9);
  }
</style>
