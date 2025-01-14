<script lang="ts">
  import {ICON_CLOUD, ICON_COG, ICON_MENU} from "$lib/Icons";
  import IconButton from "$lib/primitive/IconButton.svelte";
  import Viewbox from "$lib/primitive/Viewbox.svelte";
  import {dialogViewModel} from "$lib/dialog/DialogViewModel.svelte";

  let { title, menu }:{title:string,menu:()=>void} = $props()

</script>

<div class="panel w-full h-full flex items-center bg-primary text-primary-on">
  <IconButton path={ICON_MENU} onclick={menu} class="h-10 w-10 p-1 ml-2 rounded hover:bg-secondary hover:text-secondary-on"/>
  <Viewbox text={title} class="flex-1 ml-2 mr-2"/>
  <IconButton path={ICON_CLOUD} onclick={()=>{dialogViewModel.openHostDialog()}} class="h-10 w-10 p-1 my-2 mr-2 rounded hover:bg-secondary hover:text-secondary-on"/>
  <IconButton path={ICON_COG} onclick={()=>{dialogViewModel.openSystemDialog()}} class="h-10 w-10 p-1 my-2 mr-2 rounded hover:bg-secondary hover:text-secondary-on"/>
</div>

<style>
</style>
