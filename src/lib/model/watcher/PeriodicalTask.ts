import type {IHostInfo} from "$lib/model/ModelDef"
import type {ICapabilities} from "$lib/protocol/IBooProtocol"
import {logger} from "$lib/model/DebugLog.svelte"

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

  private cancelTimer() {
    if (this.watchingTimer) {
      clearTimeout(this.watchingTimer)
      this.watchingTimer = 0
    }
  }
  private async repeatTask() {
    logger.debug("PeriodicalTask: executing repeatTask")
    if (!this.watchingTimer) return  // もうタイマーがキャンセルされている
    let nextInterval = this.interval
    if(!this.taskBusy && this.taskSuppressed <= 0) {
      this.taskBusy = true
      try {
        await this.periodicalTask()
      } catch (e) {
        console.error("Error in periodical task:", e)
      } finally {
        this.taskBusy = false
      }
    } else {
      nextInterval = this.initialInterval
    }
    if (!this.watchingTimer) {
      logger.info("PeriodicalTask: Timer has been cancelled, stopping task.")
      return  // タイマーがキャンセルされている場合は終了
    }
    // タイマーがまだ有効な場合は、次のタスクをスケジュールする
    logger.debug(`PeriodicalTask: scheduling next task in ${nextInterval} ms`)
    this.watchingTimer = setTimeout(this.repeatTask.bind(this), nextInterval)
  }

  protected startWatch(): void {
    this.stopWatch()
    this.watchingTimer = setTimeout(this.repeatTask.bind(this), this.initialInterval)
  }

  protected stopWatch() {
    this.cancelTimer()
    this.taskSuppressed = 0
  }

  public pause() {
    this.taskSuppressed++
  }
  public resume() {
    this.taskSuppressed = Math.max(0, this.taskSuppressed - 1)
  }

  public touch(nextInterval:number= this.interval): void {
    this.cancelTimer()
    this.watchingTimer = setTimeout(this.repeatTask.bind(this),nextInterval)
  }
}