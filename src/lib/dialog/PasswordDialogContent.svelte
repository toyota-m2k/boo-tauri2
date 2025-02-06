<script lang="ts">
  import {onDestroy, onMount} from "svelte";
  import {createKeyEvents, keyFor, switchKeyEventCaster} from "$lib/utils/KeyEvents";
  import Dialog from "$lib/dialog/Dialog.svelte";
  import {passwordViewModel} from "$lib/model/PasswordViewModel.svelte";
  import {logger} from "$lib/model/DebugLog.svelte";

  let {show=$bindable()}:{show:boolean} = $props()
  let password = $state("")
  let ready = $derived(password.length>0)
  let input:HTMLInputElement = $state() as HTMLInputElement

  let positive = $derived({label:"OK", disabled:!ready})

  // $effect.pre(()=>{
  //   if(!show) {
  //     logger.info("PasswordDialogContent:cancel by close")
  //     passwordViewModel.cancel()
  //   }
  // })
  // $inspect(show).with((type,value)=>{
  //   logger.info(`PasswordDialogContent:show=${value}`)
  // })


  function action(reason:"close"|"negative"|"positive") {
    if(reason==="positive") {
      if(!onOK()) {
        return
      }
    } else {
      onCancel()
    }
    show = false
  }

  function onOK() {
    if(!ready) return false
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
  onDestroy(()=>{
    // dispose?.then(fn=>fn())
    logger.info("PasswordDialogContent:destroy")
    passwordViewModel.cancel()
  })
</script>

<Dialog title="Authentication" {positive} {action}>

  {#snippet children()}
    <div class="flex flex-col justify-center">
      <div>{passwordViewModel.target}</div>
      <input bind:this={input} type="password" bind:value={password} class="w-full p-2 border border-gray rounded-sm" placeholder="Password"/>
    </div>
  {/snippet}
</Dialog>
