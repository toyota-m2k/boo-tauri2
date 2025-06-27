import type {IHostInfo} from "$lib/model/ModelDef"
import type {ICapabilities} from "$lib/protocol/IBooProtocol"

export abstract class PeriodicalTask {
  protected interval: number
  protected initialInterval: number
  protected watchingTimer: number = 0
  protected taskBusy: boolean = false
  protected taskSuppressed: number = 0

  public constructor(interval: number = 5*60*1000, initialInterval: number = 10*1000) {
    this.interval = interval
    this.initialInterval = initialInterval
  }

  protected abstract periodicalTask(): Promise<void>

  private async repeatTask() {
    if(!this.taskBusy && this.taskSuppressed <= 0) {
      this.taskBusy = true
      try {
        await this.periodicalTask()
      } catch (e) {
        console.error("Error in periodical task:", e)
      } finally {
        this.taskBusy = false
      }
      this.watchingTimer = setTimeout(this.repeatTask.bind(this), this.interval)
    } else {
      this.watchingTimer = setTimeout(this.repeatTask.bind(this), this.initialInterval)
    }
  }

  protected startWatch(): void {
    this.stopWatch()
    this.watchingTimer = setTimeout(this.repeatTask.bind(this), this.initialInterval)
  }

  protected stopWatch() {
    if (this.watchingTimer) {
      clearTimeout(this.watchingTimer)
      this.watchingTimer = 0
    }
    this.taskSuppressed = 0
  }

  public pause() {
    this.taskSuppressed++
  }
  public resume() {
    this.taskSuppressed = Math.max(0, this.taskSuppressed - 1)
  }

  public touch(nextInterval:number= this.interval): void {
    if (this.watchingTimer) {
      clearTimeout(this.watchingTimer)
      this.watchingTimer = 0
    }
    this.watchingTimer = setTimeout(this.repeatTask.bind(this),nextInterval)
  }
}