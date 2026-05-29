import type {EventCallback} from "@tauri-apps/api/event";
import {tauriObject} from "$lib/tauri/TauriObject";
import {logger} from "$lib/model/DebugLog.svelte";

export type QueryEndSession = () => Promise<boolean>

export interface ITauriEvent {
  onTerminating(handler:QueryEndSession) : Promise<ITauriEvent>
  onFocus<T>(handler:EventCallback<T>) : Promise<ITauriEvent>
  onBlur<T>(handler:EventCallback<T>) : Promise<ITauriEvent>
}


class TauriEvent implements ITauriEvent {
  async onTerminating(handler:QueryEndSession) : Promise<ITauriEvent> {
    const window = tauriObject.window
    if(!window) return this;
    // 公式 Window.onCloseRequested は、ハンドラ完了後に preventDefault されていなければ
    // 内部で destroy() を呼ぶ。明示的な window.close() は不要。
    // ハンドラが false を返した、または例外を投げた場合は preventDefault() で閉じない。
    await window.onCloseRequested(async (e) => {
      let confirmed = false
      try {
        confirmed = await handler()
      } catch(err) {
        logger.error(`close-request handler threw: ${err}`)
      }
      if (confirmed) {
        logger.info('close-request closing.')
      } else {
        logger.info('close-request refused.')
        e.preventDefault()
      }
    })
    return this;
  }
  async onFocus<T>(handler:EventCallback<T>) : Promise<ITauriEvent> {
    const window = tauriObject.window
    if(!window) return this
    await window.listen('tauri://focus', handler)
    return this
  }
  async onBlur<T>(handler:EventCallback<T>) : Promise<ITauriEvent> {
    const window = tauriObject.window
    if(!window) return this
    await window.listen('tauri://blur', handler)
    return this
  }
}

export const tauriEvent: ITauriEvent = new TauriEvent();
