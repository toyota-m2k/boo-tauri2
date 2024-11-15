<script lang="ts">
  import {settings} from "$lib/model/Settings.svelte";
  import type {ColorVariation} from "$lib/model/ModelDef";
  const colorVariations: ColorVariation[] = ['default', 'orange', 'melon', 'cherry', 'grape', 'carrot', 'blueberry', 'soda']

  function setColorVariation(c:ColorVariation) {
    settings.colorVariation = c
  }

</script>

<div class="flex flex-col justify-center">
  <div class="flex items-center mt-2 gap-1">
    <span>Slide Show Interval</span>
    <div class="flex justify-end flex-grow items-center gap-2 pr-4">
      <input type="number" min="1" max="3600" bind:value={settings.slideShowInterval} placeholder="Slide Show Interval" class="w-1/6 h-7" />
      <span>second(s)</span>
    </div>
  </div>
  <div>
    <div>Color Variation</div>
    {#each colorVariations as c (c)}
      <div class="flex {c}">
      <input type="radio"  class="w-5 h-5 text-surface-on focus:ring-secondary" name="colorVariation" id={c} value={c} checked={settings.colorVariation===c} on:change={()=>setColorVariation(c)} />
        {#if c==='default'}
          <div class="flex-1 ml-1 px-1">
            <label for={c}>{c.toUpperCase()}</label>
          </div>
        {:else}
          <div class="flex-1 bg-primary ml-1 px-1">
            <label class="{c} text-primary-on" for={c}>{c.toUpperCase()}</label>
          </div>
          <div class="bg-secondary text-secondary-on flex-1 px-1">secondary</div>
          <div class="bg-accent text-accent-on flex-1 px-1">accent</div>
        {/if}
      </div>
    {/each}
  </div>
  <div>
    <div class="flex flex-grow items-center mt-4">
      <input type="checkbox" bind:checked={settings.isDarkMode} class="w-5 h-5 text-surface-on focus:ring-accent" />
      <label class="ml-2" for="darkMode">Dark Mode</label>
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