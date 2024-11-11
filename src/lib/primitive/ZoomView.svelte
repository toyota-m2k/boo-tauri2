<script lang="ts">

  // const dispatch = createEventDispatcher()
  import {viewModel} from "$lib/model/ViewModel.svelte";
  import {globalToLocalPoint} from "$lib/utils/Utils";
  import {logger} from "$lib/model/DebugLog.svelte";
  import {onMount, type Snippet} from "svelte";
  import {GestureRecognizer} from "$lib/utils/GestureRecognizer";

  let view: HTMLDivElement
  let container: HTMLDivElement

  // let transformOrigin: { x: number, y: number } = { x: 50, y: 50 }
  let translation: { x: number, y: number } = $state({ x: 0, y: 0 })

  let {scaleMax=10, scaleMin=1, onclick, children}:{scaleMax:number, scaleMin:number, onclick?:(e:MouseEvent)=>void,children:Snippet} = $props()

  const draggingInfo = {
    isDragging: false,
    startAt: { x: 0, y: 0,},
    initialTranslation: { x: 0, y: 0 },
    scrollRange: { x: 0, y: 0 }
  }

  function clipTranslation(x: number, y: number): { x: number, y: number } {
    const tx = Math.min(0, Math.max(x, draggingInfo.scrollRange.x))
    const ty = Math.min(0, Math.max(y, draggingInfo.scrollRange.y))
    // logger.info(`clipTranslation ${x},${y} => ${tx},${ty}`)
    return { x: tx, y: ty }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    e.stopPropagation()
    // const contentRect = view.getBoundingClientRect()
    const local = globalToLocalPoint(view, e.clientX, e.clientY)
    logger.debug(`onWheel (${local?.x ?? "u/a"}, ${local?.y ?? "u/a"})`)
    // transformOrigin = getLocalPointAsPercentage(e)
    const pivot = local
    const orgScale = viewModel.mediaScale
    let newScale
    if(e.deltaY > 0) {
      newScale = Math.max(scaleMin, orgScale - 0.1)
    } else {
      newScale = Math.min(scaleMax, orgScale + 0.1)
    }

    const viewRect = view.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    const rx = pivot.x / viewRect.width
    const ry = pivot.y / viewRect.height
    const ox = rx * containerRect.width
    const oy = ry * containerRect.height
    const dx = ox * (newScale - orgScale)
    const dy = oy * (newScale - orgScale)
    draggingInfo.scrollRange = {x: containerRect.width*(1-newScale), y: containerRect.height*(1-newScale)}
    translation = clipTranslation( translation.x - dx, translation.y - dy)
    viewModel.mediaScale = newScale
  }

  $effect(()=>{
    if(viewModel.mediaScale===1) {
      translation = {x: 0, y: 0}
    }
  })

  onMount(() => {
    const gestureRecognizer = new GestureRecognizer({
      onSingleClick: (e)=>{
        onclick?.(e)
      },
      onDoubleClick: ()=>{
        viewModel.mediaScale = 1
      },
      onDragStart: (e)=>{
        if(viewModel.mediaScale===1) return
        draggingInfo.isDragging = true
        draggingInfo.initialTranslation = {...translation}
        draggingInfo.startAt = {x:e.clientX, y:e.clientY}
      },
      onDrag: (e)=>{
        if(draggingInfo.isDragging) {
          if(draggingInfo.isDragging) {
            const dx = (e.clientX - draggingInfo.startAt.x)
            const dy = (e.clientY - draggingInfo.startAt.y)
            translation = clipTranslation(draggingInfo.initialTranslation.x+dx, draggingInfo.initialTranslation.y+dy)
          }
        }
      },
      onDragEnd: ()=>{
        draggingInfo.isDragging = false
      },
    })
    gestureRecognizer.attach(container)
    return ()=> {
      gestureRecognizer.detach(container)
    }
  })
</script>

<div bind:this={container} class="zoom-container  w-full h-full overflow-hidden"
   onwheel={onWheel}
   role="none"
  >
  <div
    class="zoom-view w-full h-full relative flex justify-center items-center"
    bind:this={view}
    style:transform="scale({viewModel.mediaScale})"
    style:transform-origin="0 0"
    style:translate="{translation.x}px {translation.y}px"
    >
    {@render children?.()}
  </div>
</div>
<style lang="scss">
</style>