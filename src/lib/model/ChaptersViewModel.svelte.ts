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
  isValidAt(pos:number):boolean
  getChapterAt(pos:number):IChapter|undefined
  currentChapterLabel:string
}

class ChaptersViewModel implements IChaptersViewModel {
  chapterList:IChapterList|undefined = $state()
  currentChapterLabel:string = $state("")

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
  isValidAt(pos:number):boolean {
    pos *= 1000 // ms
    return !this.disabledRanges.some(r=>r.start<=pos && pos<r.end)
  }
  getChapterAt(pos:number):IChapter|undefined {
    pos *= 1000 // ms
    var found:IChapter|undefined = undefined
    for(const c of this.chapters) {
      if(pos < c.position) {
        break
      }
      found = c
    }
    return found
  }
}

export const chaptersViewModel:IChaptersViewModel = new ChaptersViewModel()