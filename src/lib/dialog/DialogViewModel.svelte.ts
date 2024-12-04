class DialogViewModel {
  showSystemDialog = $state(false)
  showHostDialog = $state(false)
  showPasswordDialog = $state(false)
  showSortDialog = $state(false)

  isActive = $derived(this.showSystemDialog || this.showHostDialog || this.showPasswordDialog || this.showSortDialog)

  openSystemDialog() {
    this.showSystemDialog = true
  }
  openHostDialog() {
    this.showHostDialog = true
  }
  openSortDialog() {
    this.showSortDialog = true
  }
  closeAll() {
    this.showSystemDialog = false
    this.showHostDialog = false
    this.showPasswordDialog = false
    this.showSortDialog = false
  }
}

export const dialogViewModel = new DialogViewModel()