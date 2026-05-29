<script lang="ts">
  import IconButton from "$lib/primitive/IconButton.svelte";
  import {ICON_CHECK, ICON_EDIT, ICON_PLUS, ICON_TRASH} from "$lib/Icons";
  import {settings} from "$lib/model/Settings.svelte";
  import SvgIcon from "$lib/primitive/SvgIcon.svelte";
  import type {IHostInfo} from "$lib/model/ModelDef";
  import {isEqualHostPort} from "$lib/model/ModelDef.js";
  import Dialog from "$lib/dialog/Dialog.svelte";
  import {tauriObject} from "$lib/tauri/TauriObject";
  import {onDestroy, onMount} from "svelte";
  import {logger} from "$lib/model/DebugLog.svelte";
  import {hostDiscovery} from "$lib/model/HostDiscovery.svelte";
  import {tauriMdns, type IDiscoveredService} from "$lib/tauri/TauriMdns";
  import {parsePairingUri, pairingToHostInfo} from "$lib/protocol/PairingUri";

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
  let pairingInput = $state("")
  let pairingError = $state("")

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
    pairingInput = ""
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

  function selectDiscovered(e:MouseEvent, svc:IDiscoveredService) {
    stopPropagation(e)
    newDisplayName = svc.hostname ?? svc.serviceName
    newHostAddress = svc.host
    newHostPort = svc.port
    newUseSSL = svc.useSSL ?? false
    newFingerprint = svc.fingerprint
    newServiceName = svc.serviceName
    newHostname = svc.hostname
  }

  async function refreshDiscovery(e:MouseEvent) {
    stopPropagation(e)
    try {
      await tauriMdns.stop()
      await hostDiscovery.start()
    } catch(err) {
      logger.error(`refreshDiscovery failed: ${err}`)
    }
  }

  function applyPairing(e:MouseEvent) {
    stopPropagation(e)
    pairingError = ""
    const p = parsePairingUri(pairingInput)
    if (!p) {
      pairingError = "Invalid pairing URL"
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

  onMount(()=>{
    logger.info("HostDialogContent:mount")
    return ()=>{logger.info("HostDialogContent:unmount")}
  })
  onDestroy(()=> {
    logger.info("HostDialogContent:destroy")
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
          <!-- Discovered servers (mDNS) -->
          <div class="flex flex-row items-center mb-1">
            <div class="text-sm font-semibold flex-1">Discovered servers</div>
            <button class="text-xs text-secondary underline" onclick={refreshDiscovery}>refresh</button>
          </div>
          <div class="flex flex-col mb-3 border border-gray rounded-sm max-h-32 overflow-y-auto">
            {#if hostDiscovery.services.length === 0}
              <div class="text-xs text-gray-on-alt p-2">{hostDiscovery.isScanning ? "Scanning..." : "No servers found"}</div>
            {:else}
              {#each hostDiscovery.services as svc}
                <button class="text-left p-2 hover:bg-secondary hover:text-secondary-on border-b border-gray" onclick={(e)=>selectDiscovered(e,svc)}>
                  <div class="text-sm">{svc.hostname ?? svc.serviceName}{#if svc.useSSL}<span class="ml-2 text-xs text-accent">SSL</span>{/if}</div>
                  <div class="text-xs text-gray-on-alt">{svc.host}:{svc.port}{#if svc.app}<span class="ml-1">({svc.app})</span>{/if}</div>
                </button>
              {/each}
            {/if}
          </div>

          <!-- QR pairing URL (mobile only) -->
          {#if isMobile}
            <div class="text-sm font-semibold mb-1">Pairing URL</div>
            <div class="flex flex-row mb-3">
              <input type="text" bind:value={pairingInput} placeholder="bootube://..." class="flex-1 mr-2" />
              <button class="text-button px-2" onclick={applyPairing}>Apply</button>
            </div>
            {#if pairingError}
              <div class="text-xs text-red-500 mb-2">{pairingError}</div>
            {/if}
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
