import type {IDisposable} from "$lib/utils/IDisposable";
import {logger} from "$lib/model/DebugLog.svelte";

export class WakeLocker {
  private _sentinel: WakeLockSentinel | undefined = undefined
  get isLocked():boolean {
    return this._sentinel !== undefined;
  }
  lock() {
    try {
      if(this._sentinel) return
      navigator.wakeLock.request('screen').then((sentinel) => {
        this._sentinel = sentinel;
        logger.info('Wake locked.');
        this._sentinel.addEventListener('release', () => {
          logger.info('Wake lock released');
          this._sentinel = undefined;
        });
      })
    } catch (error) {
      logger.error(`Failed to acquire wake lock: ${error}`);
      this._sentinel = undefined;
    }
  }
  unlock() {
    if(this._sentinel) {
      this._sentinel.release().then(() => {
        this._sentinel = undefined;
      }).catch((error) => {
        console.error(`Failed to release wake lock:${error}`);
      });
    }
  }
}

export const wakeLocker = new WakeLocker();