
<script lang="ts">
  type SvgIconProps = {
    class?: string;
    path: string;
    color?: string;
    style?: string;
    onclick?: (e:MouseEvent) => void;
    fullSize?: boolean;
    [key: string]: any;
  }
  let {class:klass,path,color,style,onclick,fullSize=true, ...props}:SvgIconProps = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  fill={color??'currentColor'}
  class="{klass||'svg'}{(fullSize)? ` w-full h-full` : ''}"
  {style}
  {onclick}
  {...props}
  role="none"
  viewBox="0 0 24 24"
>
  <path
    fill-rule="evenodd"
    d={path}
    clip-rule="evenodd"
  />
</svg>
