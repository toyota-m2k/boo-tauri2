<script lang="ts">
  import {onMount} from "svelte";
  import {createKeyEvents, keyFor, switchKeyEventCaster} from "$lib/utils/KeyEvents";

  let {target,completed,closeDialog}:{target?:string|undefined, completed:(pwd:string|undefined)=>void, closeDialog:()=>void} = $props()
  let title = $derived((target&&target.length>0)?`Password for ${target}`:"Password")
  let password = $state("")
  let ready = $derived(password.length>0)
  let input:HTMLInputElement = $state() as HTMLInputElement

  function onOK() {
    if(!ready) return true
    completed(password ?? "")
    closeDialog()
    return true
  }
  function onCancel() {
    completed(undefined)
    closeDialog()
    return true
  }

  onMount(()=>{
    input.focus()
    const dlgKeyEvents = createKeyEvents()
      .register(keyFor({key:"Enter", asCode:true}), ()=>onOK())
      .register(keyFor({key:"Escape", asCode:true}), ()=>onCancel())
    return switchKeyEventCaster(dlgKeyEvents)
  })
</script>

<div class="flex flex-col justify-center">
  <div>{title}</div>
  <input bind:this={input} type="password" bind:value={password} class="w-full p-2 border border-gray rounded" placeholder="Password"/>
  <div class="flex flex-row justify-center mt-2">
    <button class:disabled={!ready} class="w-40 p-2 bg-primary text-primary-on rounded" onclick={onOK}>OK</button>
<!--    <button class="w-40 p-2 bg-secondary text-secondary-on rounded" onclick={onCancel}>Cancel</button>-->
  </div>
</div>
