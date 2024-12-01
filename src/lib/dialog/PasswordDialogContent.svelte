<script lang="ts">
  import {onMount} from "svelte";
  import {createKeyEvents, keyFor, switchKeyEventCaster} from "$lib/utils/KeyEvents";
  import Dialog from "$lib/dialog/Dialog.svelte";
  import {passwordViewModel} from "$lib/model/PasswordViewModel.svelte";

  let {show=$bindable()}:{show:boolean} = $props()
  let password = $state("")
  let ready = $derived(password.length>0)
  let input:HTMLInputElement = $state() as HTMLInputElement

  let positive = $derived({label:"OK", disabled:ready})

  $effect(()=>{
    if(!show) {
      passwordViewModel.cancel()
    }
  })
  $inspect(show)


  function action(reason:"close"|"negative"|"positive") {
    if(reason==="positive") {
      onOK()
    } else {
      onCancel()
    }
    show = false
  }

  function onOK() {
    if(!ready) return true
    passwordViewModel.complete(password ?? "")
    return true
  }
  function onCancel() {
    passwordViewModel.cancel()
    return true
  }

  onMount(()=>{
    input.focus()
    // const dlgKeyEvents = createKeyEvents()
    //   .register(keyFor({key:"Enter", asCode:true}), ()=>onOK())
    //   .register(keyFor({key:"Escape", asCode:true}), ()=>onCancel())
    // return switchKeyEventCaster(dlgKeyEvents)
  })
</script>

<Dialog title="Authentication" {positive} {action}>

  {#snippet children()}
    <div class="flex flex-col justify-center">
      <div>{passwordViewModel.target}</div>
      <input bind:this={input} type="password" bind:value={password} class="w-full p-2 border border-gray rounded" placeholder="Password"/>
    </div>
  {/snippet}
</Dialog>
