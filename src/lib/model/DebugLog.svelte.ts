import {settings} from "$lib/model/Settings.svelte";

type DevMessageLevel = "debug" | "info" | "warn" | "error"
interface IDebugMessage {
    id: number
    level: DevMessageLevel
    message: string
}
interface IDebugLog {
    push: (message: string, level:DevMessageLevel) => void
    debug(message: string): void
    info(message: string): void
    warn(message: string): void
    error(message: string): void
    exception(e:any,message?:string): void
    clear: () => void
    messages: IDebugMessage[]
}


class DebugLog implements IDebugLog {
    private nextId = 0
    messages:IDebugMessage[] = $state([])
    push(message: string, level:DevMessageLevel) {
        switch(level) {
            case "debug": console.debug(message); break
            case "info": console.info(message); break
            case "warn": console.warn(message); break
            case "error": console.error(message); break
        }
        if(!settings.enableDebugLog) return
        this.messages.push({id: this.nextId++, level, message})
    }
    debug(message: string) { this.push(message, "debug") }
    info(message: string) { this.push(message, "info") }
    warn(message: string) { this.push(message, "warn") }
    error(message: string) { this.push(message, "error")  }
    exception(e:Error|any,message?:string) {
        if(message) this.error(message)
        if(e instanceof Error) {
            this.error(e.message)
            this.error(e.stack ?? "no stack")
        } else {
            this.error(e.message ?? e.toString())
            if(e.stack) this.error(e.stack)
        }
    }
    clear() { this.messages = [] }
}

export const logger : IDebugLog = new DebugLog()