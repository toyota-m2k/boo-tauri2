import { Window } from '@tauri-apps/api/window';
import type {EventCallback, UnlistenFn} from "@tauri-apps/api/event";

class Lazy<T> {
  private _value: T | undefined = undefined;
  private _getter: () => T;

  constructor(getter: () => T) {
    this._getter = getter;
  }

  get value(): T {
    if(this._value === undefined) {
      this._value = this._getter();
    }
    return this._value;
  }
}

export type QueryEndSession = () => Promise<boolean>

export interface ITauriEvent {
  onTerminating(handler:QueryEndSession) : Promise<UnlistenFn>
  onDestroyed<T>(handler:EventCallback<T>) : Promise<UnlistenFn>
  onFocus<T>(handler:EventCallback<T>) : Promise<UnlistenFn>
  onBlur<T>(handler:EventCallback<T>) : Promise<UnlistenFn>
}


class TauriEvent implements ITauriEvent {
  private _window = new Lazy(() => new Window('main'))
  private get window(): Window { return this._window.value; }

  async onTerminating(handler:QueryEndSession) : Promise<UnlistenFn> {
    return this.window.once('tauri://close-requested', async (e) => {
      const confirmed = await handler()
      if (confirmed) {
        await this.window.close()
      }
    })
  }
  onDestroyed<T>(handler:EventCallback<T>) : Promise<UnlistenFn> {
    return this.window.listen('tauri://destroyed', handler);
  }
  onFocus<T>(handler:EventCallback<T>) : Promise<UnlistenFn> {
    return this.window.listen('tauri://focus', handler);
  }
  onBlur<T>(handler:EventCallback<T>) : Promise<UnlistenFn> {
    return this.window.listen('tauri://blur', handler);
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