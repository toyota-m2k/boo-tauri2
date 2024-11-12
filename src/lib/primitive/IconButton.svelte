<script lang="ts">
  import SvgIcon from "$lib/primitive/SvgIcon.svelte";

  type IconButtonProps = {
    class?: string;
    path: string;
    disabled?: boolean;
    onclick?: () => void;
  }
  let { class:klass, path, disabled, onclick, ...rest }:IconButtonProps = $props();
  // let disabledColor = $derived(getComputedStyle(document.documentElement).getPropertyValue("--color-gray-on"));
  // let color = $derived(disabled ? disabledColor : "currentColor");

</script>

<button class="p-0 flex justify-center items-center {klass??''}" class:disabled={disabled} {onclick}>
  <SvgIcon class="icon" path={path} {...rest}/>
</button>

<style lang="scss">
</style>