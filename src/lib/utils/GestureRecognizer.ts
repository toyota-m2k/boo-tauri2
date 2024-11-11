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
    element.addEventListener("mousedown", this.onMouseDown.bind(this))
    element.addEventListener("mouseup", this.nMouseUp.bind(this))
    element.addEventListener("mousemove", this.onMouseMove.bind(this))
    element.addEventListener("mouseleave", this.onMouseLeave.bind(this))
  }
  detach(element:HTMLElement) {
    element.removeEventListener("mousedown", this.onMouseDown.bind(this))
    element.removeEventListener("mouseup", this.nMouseUp.bind(this))
    element.removeEventListener("mousemove", this.onMouseMove.bind(this))
    element.removeEventListener("mouseleave", this.onMouseLeave.bind(this))
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

  nMouseUp(e:MouseEvent) {
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
