import {logger} from "$lib/model/DebugLog.svelte";
import {env} from "$lib/utils/Env";

interface IKeyDef {
  key: string
  asCode?: boolean   // true: key は code で指定される / false: key は key
}

interface IModifierKey {
  shift?: boolean
  ctrl?: boolean
  alt?: boolean   // Windows: Alt, Mac: Option
  meta?: boolean  // Windows: Win, Mac: ⌘ Command  --> Tauriでは、SUPER
  commandOrControl?: boolean // Windows: Ctrl, Mac: Command  : true にすると、ctrl/meta の指定は無視する
}

export interface IKey {
  mainKey: IKeyDef
  modifierKey: IModifierKey
  os?: "W" | "M" | "L" | "WM" | "WL" | "ML" | "WML"   // W:Win / M:Mac / L:Linux の組み合わせ
}

export function keyFor(mainKey: IKeyDef, modifierKey={}, os?:"W" | "M" | "L" | "WM" | "WL" | "ML" | "WML"): IKey {
  return { mainKey, modifierKey, os }
}


class KeyEventHandler {
  targetKeys: IKey[]
  action: ()=>boolean   // true: stopPropagation, preventDefault

  constructor(targetKey: IKey|IKey[], action:()=>boolean) {
    this.targetKeys = Array.isArray(targetKey) ? targetKey : [targetKey]
    this.action = action
  }

  static isTargetOS(targetKey:IKey): boolean {
    return (!targetKey.os || targetKey.os.indexOf(env.osName[0]) >=0)

  }

  private static canHandleSingle(targetKey:IKey, e: KeyboardEvent): boolean {
    // ターゲットOSか？
    if (!this.isTargetOS(targetKey)) {
      // logger.debug(`OS not matched: ${targetKey.os} !== ${env.osName}`)
      return false
    }
    // キーが一致するか？
    if (targetKey.mainKey.asCode) {
      if (e.code !== targetKey.mainKey.key) {
        // logger.debug(`Key(code) not matched: ${e.code} !== ${targetKey.mainKey.key}`)
        return false
      }
    } else {
      if (e.key !== targetKey.mainKey.key) {
        // logger.debug(`Key not matched: ${e.key} !== ${targetKey.mainKey.key}`)
        return false
      }
    }
    // 修飾キーが一致するか？
    const modifierKey = targetKey.modifierKey
    if (modifierKey.commandOrControl) {
      // commandOrControl が true なら、ctrl/meta より優先して評価する
      if (!(env.isMac ? e.metaKey : e.ctrlKey)) {
        // logger.debug(`CommandOrControl not matched: ${e.ctrlKey} !== ${modifierKey.ctrl}`)
        return false
      }
    } else {
      if (e.ctrlKey !== (modifierKey.ctrl===true)) {
        // logger.debug(`Ctrl not matched: ${e.ctrlKey} !== ${modifierKey.ctrl}`)
        return false
      }
      if (e.metaKey !== (modifierKey.meta===true)) {
        // logger.debug(`Meta not matched: ${e.metaKey} !== ${modifierKey.meta}`)
        return false
      }
    }
    if (e.shiftKey !== (modifierKey.shift===true)) {
      // logger.debug(`Shift not matched: ${e.shiftKey} !== ${modifierKey.shift}`)
      return false
    }
    if (e.altKey !== (modifierKey.alt===true)) {
      // logger.debug(`Alt not matched: ${e.altKey} !== ${modifierKey.alt}`)
      return false
    }
    logger.debug(`Matched: ${e.key} ${e.code} - shift:${e.shiftKey} ctrl:${e.ctrlKey} alt:${e.altKey} meta:${e.metaKey}`)
    return true
  }

  private canHandle(e: KeyboardEvent): boolean {
    return this.targetKeys.some((targetKey) => KeyEventHandler.canHandleSingle(targetKey, e))
  }

  handle(e: KeyboardEvent): boolean {
    if(this.canHandle(e)) {
      return this.action()
    }
    return false
  }
}

// export function keyHandler(targetKey: IKey|IKey[], action:()=>void): KeyEventHandler {
//   return new KeyEventHandler(targetKey, action)
// }
// export interface IKeyEventsRegistry {
//   register(targetKey: IKey|IKey[], action:()=>void): IKeyEventsRegistry
// }

export interface IKeyEvents {
  activate(): IKeyEvents
  deactivate(): IKeyEvents
  register(targetKey: IKey|IKey[], action:()=>boolean): IKeyEvents
  // registerOnTauri(targetKey: IKey|IKey[], action:()=>void): IKeyEvents
}

class KeyEvents implements IKeyEvents {
  private handlers: KeyEventHandler[] = []
  private _activated: boolean = false

  get activated(): boolean { return this._activated }

  register(targetKey: IKey|IKey[], action:()=>boolean): IKeyEvents {
    this.handlers.push(new KeyEventHandler(targetKey, action))
    return this
  }

  // registerOnTauri(targetKey: IKey|IKey[], action:()=>void): IKeyEvents {
  //   if(Env.isTauri) {
  //     this.register(targetKey, action)
  //   }
  //   return this
  // }

  private internalKeyboardEventHandler = (e:KeyboardEvent) => {
    if(e.defaultPrevented) return
    logger.debug(`${e.code} ${e.key} - shift:${e.shiftKey} ctrl:${e.ctrlKey} alt:${e.altKey} meta:${e.metaKey}`)
    for(const handler of this.handlers) {
      if(handler.handle(e)) {
        e.preventDefault()  // これどうだろう。。。tauriの動きと整合はとれるのか？
        e.stopPropagation()
        return
      }
    }
  }

  activate():IKeyEvents {
    if(this._activated) return this
    this._activated = true
    window.addEventListener("keyup", this.internalKeyboardEventHandler, true)
    return this
  }

  deactivate(): IKeyEvents {
    if(!this._activated) return this
    this._activated = false
    window.removeEventListener("keyup", this.internalKeyboardEventHandler, true)
    return this
  }
}

export const globalKeyEvents : IKeyEvents = new KeyEvents()

export function switchKeyEventCaster(subEvents: IKeyEvents) : () => void {
  globalKeyEvents.deactivate()
  subEvents.activate()
  return () => {
    subEvents.deactivate()
    globalKeyEvents.activate()
  }
}

export function createKeyEvents(): IKeyEvents {
  return new KeyEvents()
}
