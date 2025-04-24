class DialogViewModel {
  showSystemDialog = $state(false)
  showHostDialog = $state(false)
  showPasswordDialog = $state(false)
  showSortDialog = $state(false)
  showCategoryMenu = $state(false)    // ダイアログではないが、ダイアログと同じ扱いで。

  isActive = $derived(this.showSystemDialog || this.showHostDialog || this.showPasswordDialog || this.showSortDialog || this.showCategoryMenu)

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
    this.showCategoryMenu = false
  }
}

export const dialogViewModel = new DialogViewModel()