import {PeriodicalTask} from "$lib/model/watcher/PeriodicalTask"
import type {IHostInfo} from "$lib/model/ModelDef"
import type {ICapabilities} from "$lib/protocol/IBooProtocol"
import {viewModel} from "$lib/model/ViewModel.svelte"
import {logger} from "$lib/model/DebugLog.svelte"
import {delay, launch} from "$lib/utils/Utils"

export interface IConnectionManager {
  start(target:IHostInfo, capabilities:ICapabilities): void
  stop(): void
  pause(): void
  resume(): void
  recover(): void
}

class ConnectionManager extends PeriodicalTask implements IConnectionManager {
  private currentHost: IHostInfo | undefined = undefined
  private capabilities: ICapabilities | undefined = undefined
  private recovering: AbortController | undefined = undefined

  constructor() {
    super(5 * 60_000, 5 * 60_000)
  }

  public start(target:IHostInfo, capabilities:ICapabilities): void {
    this.stop()
    this.currentHost = target
    this.capabilities = capabilities;
    if (!capabilities.authentication) {
      console.warn("NewArrivalWatcher: capabilities.authentication is not required")
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
    if (this.capabilities?.authentication) {
      // Implement the authentication logic here
      console.info("ConnectionManager --> refreshAuthIfNeed")
      await viewModel.refreshAuthIfNeed()
    }
  }

  public recover() {
    if (this.recovering) {
      logger.info("ConnectionManager.recover() already recovering")
      return
    }
    if(!this.currentHost) {
      logger.info("ConnectionManager.recover() no currentHost")
      return
    }
    logger.info("ConnectionManager.recover()")
    const abortController = new AbortController()
    this.recovering = abortController
    this.pause()

    launch(async ()=>{
      try {
        if (await viewModel.tryConnect()) {
          return  // connected
        }
        let backoff = 500
        while (!abortController.signal.aborted && !await viewModel.tryConnect()) {
          await delay(backoff, abortController.signal)
          backoff = Math.min(backoff * 2, 5_000)   // exponential backoff
        }
        logger.info("ConnectionManager.recover() connected")
      } catch(_) {
        // maybe aborted
      } finally {
        this.recovering = undefined
        this.resume() // Resume the watcher after recovery
      }
    })
  }
}

export const connectionManager = new ConnectionManager() // 5 minutes interval, initial 10 seconds