<script lang="ts">
import {viewModel} from "$lib/model/ViewModel.svelte";
import Viewbox from "$lib/primitive/Viewbox.svelte";
import {dialogViewModel} from "$lib/dialog/DialogViewModel.svelte";

function selectCategory(category:string) {
  viewModel.setCategory(true, category)
  dialogViewModel.showCategoryMenu = false
}

</script>

<ul>
  {#each viewModel.categories as category}
    <li class="mb-0.5 bg-surface text-surface-on hover:bg-secondary hover:text-secondary-on cursor-pointer" onclick="{()=>selectCategory(category)}" role="none">
      <Viewbox class="p-2" text="{category}" maxFontSize={14}/>
    </li>
  {/each}
</ul>