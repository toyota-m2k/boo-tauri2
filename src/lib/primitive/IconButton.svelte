<script lang="ts">
  import SvgIcon from "$lib/primitive/SvgIcon.svelte";

  type IconButtonProps = {
    class?: string;
    path: string;
    color?: string;
    onclick?: () => void;
  }
  let { class:klass, path, color, onclick, ...rest }:IconButtonProps = $props();

</script>

<button class="icon-button p-0 flex justify-center items-center {klass??''}" {onclick}>
  <SvgIcon class="icon" path={path} color={color} {...rest}/>
</button>
