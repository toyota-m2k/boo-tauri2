import type {IHostInfo} from "$lib/model/ModelDef";
import type {ICapabilities} from "$lib/protocol/IBooProtocol";
import {PeriodicalTask} from "$lib/model/watcher/PeriodicalTask"
import {logger} from "$lib/model/DebugLog.svelte"
import {viewModel} from "$lib/model/ViewModel.svelte"

export interface INewArrivalWatcher {
  start(target:IHostInfo, capabilities:ICapabilities): void
  stop(): void
  pause():void
  resume():void
}

class NewArrivalWatcher extends PeriodicalTask implements INewArrivalWatcher {
  private currentHost: IHostInfo | undefined = undefined
  private capabilities: ICapabilities | undefined = undefined

  public start(target:IHostInfo, capabilities:ICapabilities): void {
    this.stop()
    this.currentHost = target
    this.capabilities = capabilities;
    if (!capabilities.diff) {
      console.warn("NewArrivalWatcher: capabilities.diff is not supported")
      return
    }
    this.startWatch()
  }

  public stop() {
    this.stopWatch()
    this.currentHost = undefined
    this.capabilities = undefined
  }

  protected async periodicalTask(): Promise<void> {
    if (this.capabilities?.diff) {
      logger.info("NewArrivalWatcher --> checkUpdateIfNeed")
      await viewModel.checkUpdateIfNeed()
    }
  }
}

export const newArrivalWatcher = new NewArrivalWatcher() // 5 minutes interval, initial 10 seconds