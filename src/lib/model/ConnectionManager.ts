import type {IHostInfo} from "$lib/model/ModelDef";
import type {ICapabilities} from "$lib/protocol/IBooProtocol";
import {viewModel} from "$lib/model/ViewModel.svelte";
import {delay, launch} from "$lib/utils/Utils";
import {logger} from "$lib/model/DebugLog.svelte";
import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";

interface IConnectionManager {
  start(host:IHostInfo,capabilities:ICapabilities): void
  stop(): void
  pause(): void
  resume(): void
  recover(): void
}

/**
 * ConnectionManager
 *
 * - ソースのジェネレーション管理 ... auto update (capabilities.diff == true)
 * - 適切なタイミング（定期的な？）での再認証
 * - エラー発生時のリトライ
 */
class ConnectionManager implements IConnectionManager {
  private currentHost: IHostInfo | undefined = undefined
  private capabilities: ICapabilities | undefined = undefined
  private get supportsDiff() { return this.capabilities?.diff === true }
  private get needsAuth() { return this.capabilities?.authentication === true }
  private watchInterval = 5*60*1000 // 5 minutes

  private watchingTimer = 0
  recovering: AbortController|undefined = undefined

  start(host:IHostInfo,capabilities:ICapabilities) {
    logger.info(`ConnectionManager.start(${host.host}:${host.port})`)
    this.currentHost = host
    this.capabilities = capabilities
    this.watch()
  }
  stop() {
    logger.info(`ConnectionManager.stop()`)
    this.reset()
    this.currentHost = undefined
    this.capabilities = undefined
  }

  pause() {
    logger.info("ConnectionManager.pause()")
    this.reset()
  }

  resume() {
    logger.info("ConnectionManager.resume()")
    if(this.currentHost) {
      this.recover()
    }
  }

  recover() {
    if(this.recovering) {
      logger.info("ConnectionManager.recover() already recovering")
      return
    }
    if(!this.currentHost) {
      logger.info("ConnectionManager.recover() no currentHost")
      return
    }
    logger.info("ConnectionManager.recover()")
    if(this.watchingTimer>0) {
      clearInterval(this.watchingTimer)
      this.watchingTimer = 0
    }
    let abortController = new AbortController()
    this.recovering = abortController
    launch(async ()=>{
      try {
        let interval = 500
        while (!await viewModel.tryConnect()) {
          await delay(interval, abortController.signal)
          interval = Math.min(interval * 2, 5_000)   // exponential backoff
        }
        logger.info("ConnectionManager.recover() connected")
        this.watch()
      } catch(_) {
        // maybe aborted
      } finally {
        this.recovering = undefined
      }
    })
  }

  private reset() {
    if(this.watchingTimer>0) {
      clearInterval(this.watchingTimer)
      this.watchingTimer = 0
    }
    if(this.recovering) {
      this.recovering.abort()
      this.recovering = undefined
    }
  }

  private watch() {
    if(this.watchingTimer>0) {
      clearInterval(this.watchingTimer)
      this.watchingTimer = 0
    }
    if(this.supportsDiff||this.needsAuth) {
      this.watchingTimer = setInterval(() => {
        launch(async ()=> {
          if (this.supportsDiff) {
            logger.info("ConnectionManager.watch() checkUpdateIfNeed")
            await viewModel.checkUpdateIfNeed()
          }
          if (this.needsAuth) {
            logger.info("ConnectionManager.watch() refreshAuthIfNeed")
            const currentToken = viewModel.token
            playerViewModel.initialSeekPosition = playerViewModel.currentPosition
            await viewModel.refreshAuthIfNeed()
            if (currentToken === viewModel.token) {
              logger.info("ConnectionManager.watch() token not changed")
              playerViewModel.initialSeekPosition = 0
            }
          }
        })
      }, this.watchInterval) // 5 minutes
    }
  }
}

export const connectionManager:IConnectionManager = new ConnectionManager()