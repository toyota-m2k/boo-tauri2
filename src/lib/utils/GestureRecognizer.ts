import {TimingSwitch} from "./TimingSwitch";
import {logger} from "$lib/model/DebugLog.svelte";


export type ClickCallback = (e:MouseEvent)=>void
export type DragCallback = (cur:MouseEvent,start:MouseEvent)=>void

const DragThresholdPow2 = 10

export class GestureRecognizer {
  constructor(
    private callbacks: {onSingleClick?:ClickCallback, onDoubleClick?:ClickCallback, onDragStart?:DragCallback, onDrag?:DragCallback, onDragEnd?:DragCallback}) {
  }
  private state:"none"|"clicked"|"dbl"|"dragging" = "none"
  private isPressed = false
  private mouseDownEvent:MouseEvent|undefined = undefined
  timer = new TimingSwitch(300, ()=>{
    this.state = "none"
    this.callbacks.onSingleClick?.(this.mouseDownEvent!)
    logger.debug("GestureRecognizer: single click")
    return false
  });

  attach(element:HTMLElement) {
    const boundOnMouseDown = this.onMouseDown.bind(this)
    const boundOnMouseUp = this.onMouseUp.bind(this)
    const boundOnMouseMove = this.onMouseMove.bind(this)
    const boundOnMouseLeave = this.onMouseLeave.bind(this)
    const boundOnClick = this.onClick.bind(this)

    element.addEventListener("mousedown", boundOnMouseDown)
    element.addEventListener("mouseup", boundOnMouseUp)
    element.addEventListener("mousemove", boundOnMouseMove)
    element.addEventListener("mouseleave", boundOnMouseLeave)
    element.addEventListener("click", boundOnClick)

    return ()=>{
      element.removeEventListener("mousedown", boundOnMouseDown)
      element.removeEventListener("mouseup", boundOnMouseUp)
      element.removeEventListener("mousemove", boundOnMouseMove)
      element.removeEventListener("mouseleave", boundOnMouseLeave)
      element.removeEventListener("click", boundOnClick)
    }
  }

  private dragEnd = false
  /**
   * dragging end したときの onClick を無視するため
   * @param e
   */
  onClick(e:Event) {
    if(this.dragEnd) {
      this.dragEnd = false
      e.preventDefault()
      e.stopPropagation()
    }
  }

  onMouseDown(e:MouseEvent) {
    this.mouseDownEvent = e
    this.isPressed = true
    switch (this.state) {
      case "none":
        this.state = "clicked"
        break
      case "clicked":
        this.state = "dbl"
        break
      default:
        break
    }
  }

  onMouseUp(e:MouseEvent) {
    this.isPressed = false
    switch(this.state) {
      case "clicked":
        if(this.callbacks.onDoubleClick) {
          this.timer.start()
        } else {
          this.state = "none"
          this.callbacks.onSingleClick?.(this.mouseDownEvent!)
          logger.debug("GestureRecognizer: single click (no double click handler)")
        }
        break
      case "dbl":
        this.timer.cancel()
        this.state = "none"
        this.callbacks.onDoubleClick?.(this.mouseDownEvent!)
        logger.debug("GestureRecognizer: double click")
        break
      case "dragging":
        this.state = "none"
        this.dragEnd = true
        this.callbacks.onDragEnd?.(e,this.mouseDownEvent!)
        logger.debug("GestureRecognizer: drag end")
        break
    }
  }

  onMouseMove(e:MouseEvent) {
    if(!this.isPressed) return
    if(this.state==="clicked" && Math.pow(e.clientX-this.mouseDownEvent!.clientX, 2)+Math.pow(e.clientY-this.mouseDownEvent!.clientY,2) > DragThresholdPow2) {
      this.timer.cancel()
      this.state = "dragging"
      this.callbacks.onDragStart?.(e,this.mouseDownEvent!)
      logger.debug("GestureRecognizer: drag start")
    } else if(this.state==="dragging") {
      this.timer.cancel()
      this.callbacks.onDrag?.(e,this.mouseDownEvent!)
      // logger.debug("GestureRecognizer: dragging")
    }
  }
  onMouseLeave(e:MouseEvent) {
    if(this.state==="dragging") {
      this.state = "none"
      this.callbacks.onDragEnd?.(e,this.mouseDownEvent!)
      logger.debug("GestureRecognizer: drag end (leave)")
    }
  }
}
