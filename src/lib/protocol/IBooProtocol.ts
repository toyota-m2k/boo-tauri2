export interface IHostInfo {
  host: string
  port: number
}

export interface IDResponse {
  id: string
}

export type MediaType = "v" | "a" | "p"
export type FileExt = "mp4" | "jpg" | "mp3"
export type ListFilter = "all" | "photo" | "video" | "audio"
export type PlayMode = "single"|"repeat"|"sequential"

export interface ICapabilities {
  cmd: string
  serverName: string
  version: number
  root: string
  category: boolean
  rating: boolean
  mark: boolean
  chapter: boolean
  reputation: number  // 0: none, 1: read, 2: read|write
  diff: boolean
  sync: boolean
  acceptRequest: boolean
  hasView: boolean
  authentication: boolean
  challenge: string | undefined
  types: string | undefined
}

export interface IAuthToken {
  token: string
  term: number
}

export interface IListRequest {
  type?: ListFilter,       // all | photo | video | audio
  category?: string | undefined,
  mark?: number | undefined,
  rating?: number | undefined,
  sourceType?: number, // 0: all, 1: listed, 2: selected
  search?: string | undefined,
}

export interface IMediaItem {
  id: string,         // media id
  name: string,
  type: FileExt,       // mp4 | jpg | mp3
  media: MediaType,      // "v" | "a" | "p"
  size: number,
  volume: number | undefined,
  start: number | undefined,
  end: number | undefined,
  duration: number | undefined,
}

export interface IMediaList {
  list: IMediaItem[],
  date: number,    // last modified
}
export function emptyMediaList():IMediaList {
  return {list:[], date:0}
}

export interface IChapter {
  position: number,
  label: string,
  skip: boolean,
}

export interface IChapterList {
  chapters: IChapter[]|undefined,
  id: string,                 // media id
}

export interface IReputation {
  id: string,
  rating?: number | undefined,
  mark?: number | undefined,
  category?: string | undefined,
}

export interface ICategory {
  label: string,
  sort: number,
  color: number,
  svg: string,
}


export interface IMark {
  mark: number,
  label: string,
  svg: string,
}

export interface IRating {
  rating: number,
  label: string,
  svg: string,
}

export interface IRatingList {
  default: number,
  items: IRating[],
}

export interface IBooProtocol {
  setup(hostInfo: IHostInfo): Promise<boolean>

  noop(): Promise<boolean>

  list(req: IListRequest): Promise<IMediaList>

  chapters(mediaId: string): Promise<IChapterList>

  checkUpdate(): Promise<boolean>

  getItemUrl(mediaItem: IMediaItem): string

  getCurrent(): Promise<string> // return current media id
  setCurrent(mediaId: string): Promise<void>

  getReputation(mediaId: string): Promise<IReputation>

  setReputation(req: IReputation): Promise<void>

  categories(): Promise<ICategory[]>

  marks(): Promise<IMark[]>

  ratings(): Promise<IRatingList>

  isSupported(type: MediaType): boolean
}

