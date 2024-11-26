<script lang="ts">
  import type {Snippet} from "svelte";
  import IconButton from "$lib/primitive/IconButton.svelte";
  import { ICON_CLOSE } from "$lib/Icons"
  import {viewModel} from "$lib/model/ViewModel.svelte";

  // Snippetの型パラメータを明示的に指定
  interface Props {
    title: string;
    children: Snippet;
  }

  let {title,children}:Props = $props()

</script>

<div class="flex flex-col w-1/2 bg-background text-background-on border border-gray">
  <div class="dialog-title p-2 bg-primary text-primary-on flex flex-row items-center">
    <div class="flex-1">{title}</div>
    <IconButton class="w-8 h-8 p-1 hover:bg-secondary hover:text-secondary-on rounded" path={ICON_CLOSE} onclick={()=>viewModel.closeDialog()}/>
  </div>
  <div class="dialog-content p-2">
    {@render children()}
  </div>
</div>
