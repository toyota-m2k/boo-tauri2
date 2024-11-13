<script lang="ts">
import {settings} from "$lib/model/Settings.svelte";
</script>

<div class="flex flex-col items-center justify-center">
  <div class="flex items-center mt-2 gap-1">
    <span>Slide Show Interval</span>
    <div class="flex justify-end flex-grow items-center gap-2 pr-4">
      <input type="number" min="1" max="3600" bind:value={settings.slideShowInterval} placeholder="Slide Show Interval" class="w-1/6 h-7" />
      <span>second(s)</span>
    </div>
  </div>
<!--  <div class="flex items-center justify-start mt-2 gap-1">-->
<!--    <span>Color Variation</span>-->
<!--    <div class="flex justify-end flex-grow items-center pr-4">-->
<!--      <button class=" secondary_button w-44 h-7">{colorVariation.toUpperCase()}<ChevronDownOutline class="w-6 h-6 ms-2 text-secondary-on" /></button>-->
<!--      <Dropdown class="p-3 space-y-3">-->
<!--        {#each colorVariations as c (c)}-->
<!--          <li>-->
<!--            <Checkbox checked="{colorVariation===c}" on:click={()=>setColorVariation(c)} class="text-surface-on    focus:ring-secondary" >{c.toUpperCase()}</Checkbox>-->
<!--          </li>-->
<!--        {/each}-->
<!--      </Dropdown>-->
<!--    </div>-->
<!--  </div>-->
<!--  <div class="flex items-center justify-start mt-2 gap-1">-->
<!--    <span>Dark Mode</span>-->
<!--    <div class="flex justify-end flex-grow items-center pr-4">-->
<!--      <ButtonGroup>-->
<!--        <Button size="xs" color="dark" class="h-7" checked={!isDarkMode} on:click={()=>{setDarkMode(false)}}>-->
<!--          LIGHT-->
<!--        </Button>-->
<!--        <Button size="xs" color="dark" class="h-7" checked={isDarkMode} on:click={()=>{setDarkMode(true)}}>-->
<!--          DARK-->
<!--        </Button>-->

<!--      </ButtonGroup>-->
<!--    </div>-->
<!--  </div>-->
</div>