<script lang="ts">
  import {onMount, tick} from 'svelte'
  import {launch} from '../utils/Utils'

  type ViewboxProps = {class?:string,text:string,maxFontSize?:number,minFontSize?:number}
  let { class: klass, text, maxFontSize=20, minFontSize=10, ...rest }:ViewboxProps = $props()

  // let fontSize = initialFontSize;
  let container: HTMLDivElement

  let prevText: string|undefined = undefined
  $effect(() => {
    if(prevText !== text) {
      prevText = text
      container.classList.remove("text-ellipsis")
      launch(async ()=>{
        await tick()
        adjustFontSize()
      })
    }
  })

  onMount(() => {
    window.addEventListener('resize', adjustFontSize)
    return () => {
      window.removeEventListener('resize', adjustFontSize)
    }
  });

  function adjustFontSize() {
    let containerWidth = container.offsetWidth

    container.style.fontSize = `${maxFontSize}px`
    let maxWidth = container.scrollWidth
    if(maxWidth <= containerWidth) return

    for(let fontSize = maxFontSize-1 ; fontSize>=minFontSize ; fontSize--) {
      container.style.fontSize = `${fontSize}px`
      if(container.scrollWidth <= containerWidth) return
    }
    container.classList.add("text-ellipsis")
  }
</script>

<div bind:this={container} class="{klass??''} text-container" {...rest}>
  {text}
</div>

<style>
  .text-container {
    white-space: nowrap;
    overflow: hidden;
  }
</style>

