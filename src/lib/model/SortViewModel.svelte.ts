import {settings} from "$lib/model/Settings.svelte";
import type {IPlayStateOnHost, SortKey} from "$lib/model/ModelDef";
import {tick} from "svelte";
import {viewModel} from "$lib/model/ViewModel.svelte";

export interface ISortViewModel {
  readonly sortKey: SortKey
  readonly descending: boolean
  reset(): void
  load(playState:IPlayStateOnHost|undefined): void
  update({sortKey,descending}: {sortKey?:string|undefined, descending?: boolean|undefined}): void
}

class SortViewModel implements ISortViewModel {
  sortKey: SortKey = $state("server")
  descending: boolean = $state(false)

  reset() {
    this.sortKey = "server"
    this.descending = false
  }

  load(playState:IPlayStateOnHost|undefined) {
    if(!playState) {
      this.reset()
    } else {
      this.sortKey = playState.sortKey
      this.descending = playState.descending
    }
  }

  update({sortKey,descending}: {sortKey?:SortKey|undefined, descending?: boolean|undefined}) {
    let modified = false
    if (sortKey) {
      this.sortKey = sortKey
      modified = true
    }
    if (descending !== undefined) {
      this.descending = descending
      modified = true
    }
    if(!modified) return
    settings.updateSortInfo(this.sortKey, this.descending)
    tick().then(()=> {
      viewModel.ensureCurrentItemVisible()
    })
  }
}

export const sortViewModel : ISortViewModel = new SortViewModel()