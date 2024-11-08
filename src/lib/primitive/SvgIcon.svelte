<script lang="ts">
  type SvgIconProps = {
    class?: string;
    path: string;
    color?: string;
  }
  let { class:klass, path, color, ...rest }:SvgIconProps = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  fill={color??'currentColor'}
  {...rest}
  class={klass||'svg'}
  role="img"
  aria-label="svg-icon"
  aria-describedby={undefined}
  viewBox="0 0 24 24"
>
  <path
    fill-rule="evenodd"
    d={path}
    clip-rule="evenodd"
  />
</svg>
