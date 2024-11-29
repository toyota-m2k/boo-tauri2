<script lang="ts">
  import IconButton from "$lib/primitive/IconButton.svelte";
  import {ICON_CHECK, ICON_EDIT, ICON_PLUS, ICON_TRASH} from "$lib/Icons";
  import {settings} from "$lib/model/Settings.svelte";
  import SvgIcon from "$lib/primitive/SvgIcon.svelte";
  import type {IHostInfo} from "$lib/model/ModelDef";
  import {isEqualHostPort} from "$lib/model/ModelDef.js";
  import {viewModel} from "$lib/model/ViewModel.svelte";

  let { closeDialog }:{closeDialog?:()=>void} = $props()
  let editingHost = $state(false)
  let targetHost: IHostInfo|undefined = $state()

  function stopPropagation(e:MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
  }

  function deleteHost(e:MouseEvent, host:IHostInfo) {
    stopPropagation(e)
    settings.hostInfoList.remove(host)
  }

  let newDisplayName = $state("")
  let newHostAddress = $state("")
  let newHostPort = $state(3500)
  function editHost(e:MouseEvent, host:IHostInfo|undefined, addHost:boolean=false) {
    stopPropagation(e)
    if(!addHost) {
      targetHost = host
    }
    newDisplayName = host?.displayName ?? ""
    newHostAddress = host?.host ?? ""
    newHostPort = host?.port ?? 3500
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
        settings.hostInfoList.add({displayName:newDisplayName, host:newHostAddress, port:newHostPort})
      }
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
    closeDialog?.()
  }
</script>

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
              <div class="text-sm text-gray-on">{host.displayName}</div>
              <div class="text-xs text-gray-on-alt">{host.host}:{host.port}</div>
            </div>
          </div>
          <IconButton class="p-1 w-8 h-8 rounded text-secondary hover:bg-secondary hover:text-secondary-on" onclick={(e)=>editHost(e,host)} path={ICON_EDIT}/>
          <IconButton class="p-1 w-8 h-8 rounded text-secondary hover:bg-secondary hover:text-secondary-on" onclick={(e)=>deleteHost(e,host)} path={ICON_TRASH}/>
        </div>
      {/each}
    </div>
    <div class="flex flex-row-reverse w-4/5">
      <IconButton class="p-1 w-6 h-6 rounded text-secondary hover:bg-secondary hover:text-secondary-on" onclick={(e)=>addHost(e)} path={ICON_PLUS}/>
      <div class="mr-2">Hosts</div>
    </div>
  {:else}
    <div class="flex flex-col">
      <div>Display name</div>
      <input type="text" bind:value={newDisplayName} placeholder="Display name" class="mb-2" />
      {#if targetHost}
        <div>Address</div>
        <div>{newHostAddress}</div>
        <div>Port</div>
        <div>{newHostPort}</div>
      {:else}
        <div>Address</div>
        <input type="text" bind:value={newHostAddress} placeholder="IP Address" class="mb-2" readonly />
        <div>Port</div>
        <input type="number" bind:value={newHostPort} placeholder="IP Address" class="mb-2" />
      {/if}

      <div class="flex flex-row items-center justify-center mt-4">
        <button class="text-button mr-4 w-20" onclick={(e)=>endEdit(e,true)}>{editingHost?"Apply":"Add"}</button>
        <button class="text-button w-20" onclick={(e)=>endEdit(e,false)}>Cancel</button>
      </div>
    </div>
  {/if}
</div>
