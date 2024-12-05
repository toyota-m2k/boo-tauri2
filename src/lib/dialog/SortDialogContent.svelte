<script lang="ts">

import Dialog from "$lib/dialog/Dialog.svelte";
import type {SortKey} from "$lib/model/ModelDef";
import {sortViewModel} from "$lib/model/SortViewModel.svelte";

let {show = $bindable()}:{show:boolean} = $props()
const sortKeys: SortKey[] = ["server", "name", "duration", "size", "date"];
const sortOrders: string[] = ["ascending", "descending"];

function capitalize(label: string): string {
  if (label.length === 0) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}
</script>

<Dialog title="Sort" action={(reason)=>{if(reason==="close"||reason==="negative") show=false}}>
  {#snippet children()}
    <div class="flex flex-col justify-center p-3">
      <div class="my-1">Sort Key</div>
      {#each sortKeys as k (k)}
        <div class="flex ml-2 mb-1.5 items-center">
          <input type="radio" class="w-5 h-5 text-surface-on focus:ring-secondary" name="sortKey" id={k} value={k} checked={sortViewModel.sortKey===k} onchange={()=>sortViewModel.update({sortKey:k})} />
          <label for={k} class="ml-1">{capitalize(k)}</label>
        </div>
      {/each}
      <div class="my-1">Sort Order</div>
      {#each sortOrders as o (o)}
        <div class="flex ml-2 mb-1.5 items-center">
          <input type="radio" class="w-5 h-5 text-surface-on focus:ring-secondary" name="sortOrder" id={o} value={o} checked={sortViewModel.descending === (o==="descending")} onchange={()=>sortViewModel.update({descending:(o==="descending")})} />
          <label for={o} class="ml-1">{capitalize(o)}</label>
        </div>
      {/each}
    </div>
  {/snippet}
</Dialog>
