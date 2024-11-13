import type {IChapter, IChapterList, IMediaItem} from "$lib/protocol/IBooProtocol";
import {getDisabledRanges, type IRange, RangeOrNull} from "$lib/model/ChapterUtils";
import {viewModel} from "$lib/model/ViewModel.svelte";
import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
import {launch} from "$lib/utils/Utils";

interface IChaptersViewModel {
  chapterList:IChapterList|undefined
  chapters:IChapter[]
  disabledRanges:IRange[]
  attach():void
  nextChapter():void
  prevChapter():void
  gotoChapter(chapter:IChapter):void
}

class ChaptersViewModel implements IChaptersViewModel {
  chapterList:IChapterList|undefined = $state()

  chapters:IChapter[] = $derived(this.chapterList?.chapters ?? [])
  disabledRanges:IRange[] = $derived.by(()=>{
    const ownerItem = viewModel.currentItem
    if(ownerItem && this.chapterList) {
      return getDisabledRanges(this.chapters,RangeOrNull(ownerItem.start, ownerItem.end))
    } else {
      return []
    }
  })

  attach() {
    // currentItemが変化したら、chapterListをサーバーから読み直す
    $effect(() => {
      const item = viewModel.currentItem
      this.chapterList = undefined
      if (item) {
        launch(async () => {
          this.chapterList = await viewModel.boo.chapters(item.id)
        })
      }
    })
  }

  gotoChapter(chapter:IChapter|undefined) {
    if(chapter) {
      playerViewModel.currentPosition = chapter.position/1000
    }
  }
  nextChapter() {
    const cl = this.chapters
    const pos = playerViewModel.currentPosition * 1000 // ms
    this.gotoChapter(cl.find((c) => {
      // return pos < c.position
      return c.position-pos > 1 // 丸め誤差 1msを考慮
    }))
  }
  prevChapter() {
    const cl = this.chapters
    const pos = playerViewModel.currentPosition * 1000 - (playerViewModel.playing ? 500 : 0)  // ms
    this.gotoChapter(cl?.findLast((c) => {
      // return pos > c.position
      return c.position-pos < -1 // 丸め誤差 1msを考慮
    }))
  }
}

export const chaptersViewModel:IChaptersViewModel = new ChaptersViewModel()