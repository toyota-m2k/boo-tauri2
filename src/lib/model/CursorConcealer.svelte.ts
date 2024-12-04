import {TimingSwitch} from "$lib/utils/TimingSwitch";

export class CursorConcealer {
  hideCursor: boolean = $state(false)
  timingSwitch = new TimingSwitch(3000, ()=>{
    this.hideCursor = true
  }).start()

  onMouseMove() {
    this.hideCursor = false
    this.timingSwitch.start()
  }
}