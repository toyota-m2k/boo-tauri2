import type {IMediaItem} from "$lib/protocol/IBooProtocol";

export interface IUpdateList {
  addItem(item: IMediaItem): void
  addItems(items: IMediaItem[]): void
  getUpdates(): IMediaItem[]
  clearUpdates(): void
  hasUpdates: boolean
}

class UpdateListSvelte implements IUpdateList {
  private updates: IMediaItem[] = $state([]);

  public hasUpdates: boolean = $derived(this.updates.length > 0);

  addItem(item: IMediaItem): void {
    const i = this.updates.findIndex(i => i.id === item.id)
    if (i >= 0) {
      this.updates[i] = item; // 更新
    } else {
      this.updates.push(item); // 新規追加
    }
  }
  addItems(items: IMediaItem[]): void {
    items.forEach(item => this.addItem(item));
  }

  getUpdates(): IMediaItem[] {
    return this.updates;
  }

  clearUpdates(): void {
    this.updates = [];
  }
}

export const updateList: IUpdateList = new UpdateListSvelte();