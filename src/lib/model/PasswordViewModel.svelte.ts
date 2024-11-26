export class PasswordViewModel {
  authFor:string|undefined = $state(undefined)
  pwdResolver:((value:string|undefined)=>void)|undefined = undefined
  onCompleted(value:string|undefined) {
    if(this.pwdResolver) {
      this.pwdResolver(value)
      this.pwdResolver = undefined
    }
  }
  cancel() {
    this.onCompleted(undefined)
  }
  waitFor(authFor:string|undefined):Promise<string|undefined> {
    this.authFor = authFor
    return new Promise<string|undefined>((resolve) => {
      this.pwdResolver = resolve
    })
  }
}