<script lang="ts">
  import {ICON_CLOUD, ICON_COG, ICON_MENU} from "$lib/Icons";
  import IconButton from "$lib/primitive/IconButton.svelte";
  import Viewbox from "$lib/primitive/Viewbox.svelte";
  import {dialogViewModel} from "$lib/dialog/DialogViewModel.svelte";
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import CategoryList from "$lib/component/CategoryList.svelte";
  import { slide, fade } from "svelte/transition";

  let { title, menu }:{title:string,menu:()=>void} = $props()

  function onCategoryEnabled(e:Event) {
    const enabled = (e.target as HTMLInputElement).checked
    viewModel.setCategory(enabled,undefined)
  }

  function onChangingCategory() {
    if(!viewModel.enableCategory) {
      viewModel.setCategory(true,undefined)
    }
    dialogViewModel.showCategoryMenu = true
  }
</script>

<div class="panel w-full h-full flex items-center bg-primary text-primary-on overflow-visible">
  <IconButton path={ICON_MENU} onclick={menu} class="h-10 w-10 p-1 ml-2 rounded hover:bg-secondary hover:text-secondary-on"/>
  <Viewbox text={title} class="flex-1 ml-2 mr-2"/>
  {#if viewModel.supportCategory}
    <input type="checkbox" checked="{viewModel.enableCategory}" onchange={onCategoryEnabled} class="h-6 w-6 my-2 mr-1 rounded hover:bg-secondary hover:text-secondary-on"/>
    <div class="flex-col relative h-8 w-32 my-3 mr-4">
      <button class="h-8 w-32 px-2 rounded border border-secondary-on hover:bg-secondary hover:text-secondary-on" onclick={onChangingCategory}>
        <Viewbox text={(viewModel.enableCategory && viewModel.currentCategory) ? viewModel.currentCategory : "ALL"}>
        </Viewbox>
      </button>
      {#if dialogViewModel.showCategoryMenu}
        <div transition:slide class="text-center relative bg-background z-10 w-48 overflow-x-visible max-h-96 overflow-y-auto">
          <CategoryList></CategoryList>
        </div>
      {/if}
    </div>
    {/if}
  <IconButton path={ICON_CLOUD} onclick={()=>{dialogViewModel.openHostDialog()}} class="h-10 w-10 p-1 my-2 mr-2 rounded hover:bg-secondary hover:text-secondary-on"/>
  <IconButton path={ICON_COG} onclick={()=>{dialogViewModel.openSystemDialog()}} class="h-10 w-10 p-1 my-2 mr-2 rounded hover:bg-secondary hover:text-secondary-on"/>
</div>

<style>
</style>
