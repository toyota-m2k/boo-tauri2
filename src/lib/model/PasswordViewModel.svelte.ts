import {dialogViewModel} from "$lib/dialog/DialogViewModel.svelte";

class PasswordViewModel {
  authFor:string|undefined = $state(undefined)
  target:string = $derived(this.authFor ? `Password for ${this.authFor}` : "Password")
  pwdResolver:((value:string|undefined)=>void)|undefined = undefined
  complete(value:string|undefined) {
    if(this.pwdResolver) {
      this.pwdResolver(value)
      this.pwdResolver = undefined
    }
  }
  cancel() {
    this.complete(undefined)
  }
  waitFor(authFor:string|undefined):Promise<string|undefined> {
    this.authFor = authFor
    return new Promise<string|undefined>((resolve) => {
      this.pwdResolver = resolve
    })
  }
  authenticate(target:string|undefined):Promise<string|undefined> {
    dialogViewModel.showPasswordDialog = true
    return passwordViewModel.waitFor(target)
  }
}

export const passwordViewModel = new PasswordViewModel()