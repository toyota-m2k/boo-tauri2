<script lang="ts">
  import {onDestroy, onMount, type Snippet} from "svelte";
  import IconButton from "$lib/primitive/IconButton.svelte";
  import { ICON_CLOSE } from "$lib/Icons"
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {logger} from "$lib/model/DebugLog.svelte";
  import {createKeyEvents, keyFor} from "$lib/utils/KeyEvents";

  // Snippetの型パラメータを明示的に指定
  interface Props {
    title: string
    action:(reason:"close"|"negative"|"positive")=>void
    onClosed?:()=>void
    positive?: {label:string, disabled:boolean}
    negative?: {label:string, disabled:boolean}
    children: Snippet
  }

  let {title, action, onClosed, positive, negative, children}:Props = $props()

  // let dispose: (()=>void)|undefined = undefined

  // $inspect(positive?.disabled).with((type,value)=>logger.debug(`Dialog:positive.disabled=${value}`))

  onMount(()=>{
    const keyMap = createKeyEvents()
      .register(keyFor({key: "Escape", asCode: false}), ()=>{action("negative"); return true})
      .register(keyFor({key: "Enter", asCode: false}), ()=>{action("positive"); return true})

    const dispose = viewModel.switchKeyMapOnDialog(keyMap)
    return ()=>{
      dispose()
      onClosed?.()
    }
  })

  function preventDefault(e:Event) {
    // e.preventDefault()  // これを入れると、ダイアログ上のチェックボックスが動かなくなる
    e.stopPropagation()    // これを入れないと、ダイアログ上をクリックしたとき（ガードビューにイベントが伝播してダイアログが閉じてしまう）
  }
  function callAction(reason:"close"|"negative"|"positive") {
    if(positive?.disabled && reason==="positive") return
    if(negative?.disabled && reason==="negative") return
    action(reason)
  }
</script>

<div class="flex flex-col w-1/2 bg-background text-background-on border border-gray" onclick={preventDefault} onmousedown={preventDefault} role="none">
  <div class="dialog-title px-2 py-1 bg-primary text-primary-on flex flex-row items-center">
    <div class="flex-1">{title}</div>
    <IconButton class="w-7 h-7 p-1 hover:bg-secondary hover:text-secondary-on rounded-sm" path={ICON_CLOSE} onclick={()=>action("close")}/>
  </div>
  <div class="dialog-content p-2">
    {@render children()}
  </div>
  {#if positive || negative}
  <div class="flex flex-row justify-center mt-1 mb-3 mx-2">
    {#if positive}
      <button class:disabled={positive.disabled} class="w-40 p-1 bg-primary text-primary-on rounded-sm" onclick={()=>action("positive")}>{positive.label}</button>
    {/if}
    {#if negative}
      <button class:disabled={negative.disabled} class="w-40 p-1 bg-secondary text-secondary-on rounded-sm" onclick={()=>action("negative")}>{negative.label}</button>
    {/if}
  </div>
  {/if}
</div>

<style lang="scss">
  button.disabled {
    color: var(--color-gray-on-alt);
    background-color: var(--color-gray);
  }
</style>