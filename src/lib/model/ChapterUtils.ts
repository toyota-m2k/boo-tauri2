import type {IChapter} from "../protocol/IBooProtocol";

export interface IRange {
  start: number
  end: number
}

export function Range(start:number, end:number=0):IRange {
  return {start, end}
}

export function RangeOrNull(start:number|undefined, end:number|undefined):IRange|undefined {
  return !start && !end ? undefined : {start:start??0, end:end??0}
}

export class RangeUt {
  constructor(
    public range: IRange
  ) {}
  contains(pos:number):boolean {
    return contains(this.range, pos)
  }
  isEmpty():boolean {
    return isEmpty(this.range)
  }
  span():number {
    return this.range.end - this.range.start
  }
  clip(pos:number):number {
    if(this.range.start<this.range.end) {
      return Math.min(Math.max(this.range.start, pos), this.range.end)
    } else {
      return Math.max(this.range.start, pos)
    }
  }
  // terminate(duration:number) {
  //   if(this.range.end===0) {
  //     this.range.end = duration
  //   }
  // }

  static contains(r:IRange, pos:number):boolean {
    return contains(r, pos)
  }
  static isEmpty(r:IRange):boolean {
    return isEmpty(r)
  }
}

function contains(r:IRange, pos:number):boolean {
  if(r.start<r.end) {
    return r.start <= pos && pos < r.end
  } else {
    return r.start <= pos
  }
}

function isEmpty(r:IRange):boolean {
  return r.start === 0 && r.end===0
}


function enabledRangesNoTrimming(chapters:IChapter[]):IRange[] {
  let skipping = false
  let checking = 0
  const result:IRange[] = []

  for(const r of chapters) {
    if (skipping !== r.skip) {
      if (r.skip) {
        // enabled --> disabled at r.position
        skipping = true
        if (checking < r.position) {
          result.push(Range(checking, r.position))
          checking = r.position
        }
      } else {
        // disabled --> enabled at r.position
        skipping = false
        checking = r.position
      }
    }
  }
  if(!skipping) {
    result.push(Range(checking))
  }
  return result
}

function enabledRangesWithTrimming(chapters:IChapter[], trimming: IRange) : IRange[] {
  const result: IRange[] = []
  for (const r of enabledRangesNoTrimming(chapters)) {
    if (r.end > 0 && r.end < trimming.start) {
      // 有効領域 r が、trimming.start によって無効化されるのでスキップ
      //   s         e
      //   |--- r ---|
      // ...............|--- trimming ---
      // continue
    } else if (trimming.end > 0 && trimming.end < r.start) {
      // 有効領域 r が、trimming.end によって無効化されるのでスキップ
      //                                    s         e
      //                                    |--- r ---|
      // ...............|--- trimming ---|....
      // continue
    } else if (r.start < trimming.start) {
      // 有効領域 r の後半が trimming 範囲と重なる
      //   s         e
      //   |--- r ---|
      // ......| --- trimming ---|
      if (r.end > 0 && contains(trimming, r.end)) {
        result.push(Range(trimming.start, r.end))
      }
        // trimming 範囲全体が、有効領域 rに含まれる
        //   s         e
        //   |--- r --------------------|
      // ......| --- trimming ---|
      else {
        result.push(trimming)
      }
    } else { // trimming.start < r.start
      // 有効領域 r の前半が trimming の範囲と重なる
      //                   s         e
      //                   |--- r ---|
      // ......| --- trimming ---|
      if (trimming.end > 0 && contains(r, trimming.end)) {
        result.push(Range(r.start, trimming.end))
      }
        // 有効範囲 r 全体が　trimming範囲に含まれる
        //           s         e
        //           |--- r ---|
      // ......| --- trimming ---|
      else {
        result.push(r)
      }
    }
  }
  return result
}


export function getEnabledRanges(chapters:IChapter[], trimming?: IRange) :IRange[] {
  if (!trimming || isEmpty(trimming)) {
    return enabledRangesNoTrimming(chapters)
  } else {
    return enabledRangesWithTrimming(chapters, trimming)
  }
}

export function getDisabledRanges(chapters:IChapter[], trimming?: IRange): IRange[] {
  const result: IRange[] = []
  let checking = 0
  const enabledRanges = getEnabledRanges(chapters, trimming)
  for (const r of enabledRanges) {
    if (checking < r.start) {
      result.push(Range(checking, r.start))
    }
    checking = r.end
    if (checking === 0) {
      return result // 残りは最後まで有効（これ以降、無効領域はない）
    }
  }
  result.push(Range(checking, 0))
  return result
}
