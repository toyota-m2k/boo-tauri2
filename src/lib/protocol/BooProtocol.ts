import {authentication} from "./Authentication"
import {BooError} from "../model/BooError";
import {
  emptyCapabilities,
  type IAuthToken,
  type IBooProtocol,
  type ICapabilities, type ICategoryList,
  type IChapterList, type ICheckResult, type IDResponse,
  type IListRequest, type IMark, type IMediaItem,
  type IMediaList, type IRatingList, type IReputation, type MediaType
} from './IBooProtocol'
import {fetchWithTimeout} from "../utils/Utils";
import {logger} from "../model/DebugLog.svelte";
import type {IHostInfo} from "$lib/model/ModelDef";
import {createAuthInfo, type IAuthInfo} from "$lib/protocol/AuthInfo.svelte";

class BooProtocolImpl implements IBooProtocol {
  private hostPort: IHostInfo | undefined
  private challenge: string | undefined
  private secret: string | undefined

  capabilities: ICapabilities = emptyCapabilities
  authInfo: IAuthInfo = createAuthInfo()
  categories: string[] = []

  constructor(private readonly requirePassword: (target:string|undefined) => Promise<string|undefined>) {
  }

  private reset() {
    this.capabilities = emptyCapabilities
    this.hostPort = undefined
    this.challenge = undefined
    this.secret = undefined
    this.authInfo.reset()
    this.categories = []
  }

  async setup(hostInfo: IHostInfo): Promise<boolean> {
    try {
      this.reset()
      this.hostPort = hostInfo
      this.capabilities = await this.getCapabilities()
      this.challenge = this.capabilities?.challenge
      this.categories = await this.getCategories()
      return true
    } catch (e: any) {
      logger.exception(e.toString(), `cannot setup for ${hostInfo.host}:${hostInfo.port}`)
      return false
    }
  }

  private async getCapabilities(): Promise<ICapabilities> {
    const url = this.baseUri + 'capability'
    const r = await fetchWithTimeout(url, 3000)
    if (!r.ok) {
      throw new Error(`fetch failed: ${r.status}`)
    }
    return (await r.json()) as ICapabilities
  }

  private get baseUri(): string {
    if (this.hostPort === undefined) {
      throw new Error('hostInfo is not initialized')
    }
    // noinspection HttpUrlsUsage
    return `http://${this.hostPort.host}:${this.hostPort.port}/`
  }

  get needAuth(): boolean {
    return this.capabilities?.authentication === true
  }

  private async auth(password: string): Promise<boolean> {
    // if(!this.needAuth) {
    //     return true // no authentication required
    // }
    this.secret = undefined
    const challenge = await this.getChallenge(false)
    if (!challenge) {
      throw new BooError('generic', 'failed to get challenge')
    }
    const url = this.baseUri + 'auth'
    const r = await fetch(url, {
      method: "PUT",
      cache: "no-cache",
      headers: {
        "Content-Type": "text/plain",
      },
      body: authentication.createPassPhrase(password, challenge)
    })
    if (!r.ok) {
      const json = await r.json()
      this.challenge = json["challenge"] as string
      this.authInfo.failed()
      return false
    }
    this.authInfo.authenticated((await r.json() as IAuthToken).token)
    this.secret = password
    return true
  }

  private async getChallenge(force: boolean): Promise<string | undefined> {
    if (!force && this.challenge) {
      return this.challenge
    }
    const url = this.baseUri + 'auth'
    const r = await fetch(url)
    if (!r.ok) {
      return undefined
    }
    this.challenge = (await r.json())["challenge"] as string
    return this.challenge
  }

  private async ensureAuth(): Promise<void> {
    let password: string | undefined
    while (true) {
      password = this.secret ?? await this.requirePassword(this.hostPort?.displayName ?? this.hostPort?.host)
      if (!password) {
        throw new BooError('cancel', 'password has not been set.')
      }
      if(await this.auth(password)) {
        return
      }
      logger.warn("password is incorrect.")
    }
  }

  private async withAuthToken<T>(fn: (token?: string) => Promise<T>): Promise<T> {
    if (!this.needAuth) {
      return await fn()
    }
    while (true) {
      try {
        if (this.authInfo.token) {
          const ret = await fn(this.authInfo.token)
          logger.debug(`boo auth result = ${JSON.stringify(ret)}`)
          return ret
        } else {
          // noinspection ExceptionCaughtLocallyJS
          throw new BooError('auth', 'auth token is not set.')
        }
      } catch (e: unknown) {
        if (BooError.isBooError(e) && e.reason === 'auth') {
          await this.ensureAuth()
        } else {
          throw e
        }
      }
    }
  }

  private async handleResponse<T>(r: Response): Promise<T> {
    return await (await this.handleResponseRaw(r)).json() as T
  }
  private async handleResponseRaw(r:Response):Promise<Response> {
    if (!r.ok) {
      if (r.status === 401) {
        this.challenge = (await r.json())["challenge"] as string
        throw new BooError('auth', 'authentication failed')
      } else {
        throw new Error(`fetch failed: ${r.status}`)
      }
    }
    return r
  }

  /**
   * @return true: connected, false: not connected
   */
  async touch(): Promise<boolean> {
    if(this.capabilities?.authentication) {
      try {
        return await this.withAuthToken(async (token?: string) => {
          const url = this.baseUri + 'auth/' + (token ?? '')
          const r = await fetchWithTimeout(url, 3000)
          await this.handleResponseRaw(r)
          return true
        })
      } catch (e) {
        logger.error(`re-auth failed: ${e}`)
        return false
      }
    } else {
      try {
        const url = this.baseUri + 'nop'
        const r = await fetchWithTimeout(url, 3000)
        await this.handleResponseRaw(r)
        return true
      } catch (e) {
        logger.error(`nop failed: ${e}`)
        return false
      }
    }
  }

  async list(req: IListRequest): Promise<IMediaList> {
    return await this.withAuthToken(async (token?: string) => {
      const query = new URLSearchParams()
      if (token) {
        query.set('auth', token)
      }
      if (req.category) {
        query.set('c', req.category)
      }
      if (req.mark !== undefined) {
        query.set('m', req.mark.toString())
      }
      if (req.rating !== undefined) {
        query.set('r', req.rating.toString())
      }
      if (req.type) {
        query.set('type', req.type)
      }
      if (req.sourceType) {
        query.set('s', req.sourceType.toString())
      }
      if (req.search) {
        query.set('t', req.search)
      }

      const url = this.baseUri + 'list?' + query.toString()
      return await this.handleResponse<IMediaList>(await fetch(url))
    })
  }

  async chapters(mediaId: string): Promise<IChapterList> {
    if(this.capabilities?.chapter) {
      const url = this.baseUri + `chapter?id=${mediaId}`
      return await this.handleResponse<IChapterList>(await fetch(url))
    } else {
      return {chapters: [], id: mediaId}
    }
  }

  getItemUrl(mediaItem: IMediaItem, token:string|undefined): string {
    let auth = ``
    if (this.needAuth) {
      if(!token) return ''
      auth = `&auth=${token}`
    }
    switch (mediaItem.type as string) {
      case 'jpg':
      case 'jpeg':
      case 'png':
        return this.baseUri + `photo?id=${mediaItem.id}`+auth
      default:
        return this.baseUri + `video?id=${mediaItem.id}`+auth
    }
  }

  async checkUpdate(currentList:IMediaList): Promise<boolean> {
    if (!this.capabilities?.diff) {
      return false  // not supported --> チェック不要
    }
    if(!currentList.date) {
      return false
    }
    const url = this.baseUri + `check?date=${currentList.date}`
    try {
      const r = await this.handleResponse<ICheckResult>(await fetch(url))
      return r.update === '1'
    } catch (e) {
      logger.error(`failed to check update: ${e}`)
      return false
    }
  }

  async getCurrent(): Promise<string> {
    const url = this.baseUri + 'current'
    return (await this.handleResponse<IDResponse>(await fetch(url))).id
  }

  async setCurrent(mediaId: string): Promise<void> {
    const url = this.baseUri + 'current'
    await fetch(url, {
      method: "PUT",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({id: mediaId})
    })
  }

  async getReputation(mediaId: string): Promise<IReputation> {
    if (!this.capabilities?.reputation) {
      return {id: mediaId}
    }
    const url = this.baseUri + `reputation?id=${mediaId}`
    return await this.handleResponse<IReputation>(await fetch(url))
  }

  async setReputation(req: IReputation): Promise<void> {
    if (this.capabilities?.reputation !== 2) {
      return
    }
    const url = this.baseUri + 'reputation'
    await fetch(url, {
      method: "PUT",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req)
    })
  }

  private async getCategories(): Promise<string[]> {
    if (!this.capabilities?.category) {
      return []
    }
    const url = this.baseUri + 'categories'
    // const cats = (await this.handleResponse<ICategoryList>(await fetch(url)))?.categories
    // if(!cats) return []
    // const catsLabels = cats.sort((a, b) => a.sort - b.sort).map(c => c.label)
    // return catsLabels
    return (await this.handleResponse<ICategoryList>(await fetch(url)))?.categories?.sort((a, b) => a.sort - b.sort)?.map(c => c.label) ?? []
  }

  async marks(): Promise<IMark[]> {
    if (!this.capabilities?.mark) {
      return []
    }
    const url = this.baseUri + 'marks'
    return await this.handleResponse<IMark[]>(await fetch(url))
  }

  async ratings(): Promise<IRatingList> {
    if (!this.capabilities?.rating) {
      return {default: 0, items: []}
    }
    const url = this.baseUri + 'ratings'
    return await this.handleResponse<IRatingList>(await fetch(url))
  }

  isSupported(type: MediaType): boolean {
    return this.capabilities?.types?.includes(type) ?? false
  }
}

export function createBooProtocol(requirePassword: (target:string|undefined) => Promise<string|undefined>): IBooProtocol {
  return new BooProtocolImpl(requirePassword)
}