class DialogViewModel {
  showSystemDialog = $state(false)
  showHostDialog = $state(false)
  showPasswordDialog = $state(false)

  isActive = $derived(this.showSystemDialog || this.showHostDialog || this.showPasswordDialog)

  openSystemDialog() {
    this.showSystemDialog = true
  }
  openHostDialog() {
    this.showHostDialog = true
  }
  closeAll() {
    this.showSystemDialog = false
    this.showHostDialog = false
    this.showPasswordDialog = false
  }
}

export const dialogViewModel = new DialogViewModel()