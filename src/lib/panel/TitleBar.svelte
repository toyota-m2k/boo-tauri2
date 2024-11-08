<script lang="ts">
  import {ICON_MENU} from "$lib/Icons";
  import IconButton from "$lib/primitive/IconButton.svelte";
  import Viewbox from "$lib/primitive/Viewbox.svelte";

  let { title, menu }:{title:string,menu:()=>void} = $props()
</script>

<div class="panel">
  <IconButton path={ICON_MENU} onclick={menu} class="h-10 w-10 p-1"/>
  <Viewbox text={title} class="flex-grow ml-2"/>
</div>

<style>
  .panel {
    background-color: rgba(255,0,0,0.5);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
  }
</style>
