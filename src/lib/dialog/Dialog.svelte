<script lang="ts">
  import type {Snippet} from "svelte";
  import IconButton from "$lib/primitive/IconButton.svelte";
  import { ICON_CLOSE } from "$lib/Icons"
  import {viewModel} from "$lib/model/ViewModel.svelte";

  // Snippetの型パラメータを明示的に指定
  interface Props {
    title: string
    action:(reason:"close"|"negative"|"positive")=>void
    positive?: {label:string, disabled:boolean}
    negative?: {label:string, disabled:boolean}
    children: Snippet
  }

  let {title, action, positive, negative, children}:Props = $props()

</script>

<div class="flex flex-col w-1/2 bg-background text-background-on border border-gray">
  <div class="dialog-title px-2 py-1 bg-primary text-primary-on flex flex-row items-center">
    <div class="flex-1">{title}</div>
    <IconButton class="w-7 h-7 p-1 hover:bg-secondary hover:text-secondary-on rounded" path={ICON_CLOSE} onclick={()=>action("close")}/>
  </div>
  <div class="dialog-content p-3">
    {@render children()}
  </div>
  {#if positive || negative}
  <div class="flex flex-row justify-center my-2">
    {#if positive}
      <button class:disabled={positive.disabled} class="w-40 p-1 bg-primary text-primary-on rounded" onclick={()=>action("positive")}>{positive.label}</button>
    {/if}
    {#if negative}
      <button class:disabled={negative.disabled} class="w-40 p-1 bg-secondary text-secondary-on rounded" onclick={()=>action("negative")}>{negative.label}</button>
    {/if}
  </div>
  {/if}
</div>
