import { Window } from '@tauri-apps/api/window';
import type {EventCallback, UnlistenFn} from "@tauri-apps/api/event";
import {Lazy} from "$lib/utils/Lazy";
import {tauriObject} from "$lib/tauri/TauriObject";

export type QueryEndSession = () => Promise<boolean>

export interface ITauriEvent {
  onTerminating(handler:QueryEndSession) : Promise<ITauriEvent>
  // onDestroyed<T>(handler:EventCallback<T>) : Promise<UnlistenFn>
  onFocus<T>(handler:EventCallback<T>) : Promise<ITauriEvent>
  onBlur<T>(handler:EventCallback<T>) : Promise<ITauriEvent>
}


class TauriEvent implements ITauriEvent {
  async onTerminating(handler:QueryEndSession) : Promise<ITauriEvent> {
    const window = tauriObject.window
    if(!window) return this;
    const unlisten = await window.listen('tauri://close-requested', async (e) => {
      const confirmed = await handler()
      if (confirmed) {
        unlisten()
        await window.close()
      }
    })
    return this;
  }
  // onDestroyed<T>(handler:EventCallback<T>) : Promise<UnlistenFn> {
  //   return this.window.listen('tauri://destroyed', handler);
  // }
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

// const window = new Window('main')
// await window.onCloseRequested(async (e) => {
//   console.log('close-requested')
//   const confirmed = confirm('アプリケーションを終了しますか？')
//   if (!confirmed) {
//     e.preventDefault()
//   }
// })

export const tauriEvent: ITauriEvent = new TauriEvent();