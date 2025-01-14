export interface IAuthInfo {
  readonly status:"noAuth"|"ready"|"failed"
  readonly needAuth:boolean
  readonly token:string|undefined

  authenticated(token:string):void
  failed():void
  reset():void
}

class AuthInfo implements IAuthInfo{
  status:"noAuth"|"ready"|"failed" = $state("noAuth")
  needAuth = $state(false)
  token = $state<string|undefined>(undefined)

  authenticated(token:string) {
    if(token) {
      this.status = "ready"
      this.token = token
      this.needAuth = true
    }
  }
  failed() {
    this.status = "failed"
    this.token = undefined
    this.needAuth = true
  }
  reset() {
    this.status = "noAuth"
    this.token = undefined
    this.needAuth = false
  }
}

export function createAuthInfo():IAuthInfo {
  return new AuthInfo()
}