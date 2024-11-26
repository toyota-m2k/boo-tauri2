import {authentication} from "./Authentication"
import {BooError} from "../model/BooError";
import type {
  IAuthToken,
  IBooProtocol,
  ICapabilities, ICategory,
  IChapterList, IDResponse,
  IListRequest, IMark, IMediaItem,
  IMediaList, IRatingList, IReputation, MediaType
} from './IBooProtocol'
import {fetchWithTimeout} from "../utils/Utils";
import {logger} from "../model/DebugLog.svelte";
import type {IHostInfo, IHostPort} from "$lib/model/ModelDef";

class BooProtocolImpl implements IBooProtocol {
  private hostPort: IHostInfo | undefined
  private capabilities: ICapabilities | undefined
  private authToken: IAuthToken | undefined
  private challenge: string | undefined
  private readonly requirePassword: ((target:string|undefined) => Promise<string|undefined>)

  constructor(requirePassword: (target:string|undefined) => Promise<string|undefined>) {
    this.requirePassword = requirePassword
  }

  private reset() {
    this.capabilities = undefined
    this.hostPort = undefined
    this.authToken = undefined
    this.challenge = undefined
  }

  async setup(hostInfo: IHostInfo): Promise<boolean> {
    try {
      this.reset()
      this.hostPort = hostInfo
      this.capabilities = await this.getCapabilities()
      this.challenge = this.capabilities?.challenge
      return this.capabilities !== undefined
    } catch (e: any) {
      logger.error(`cannot setup for ${hostInfo.host}:${hostInfo.port}`)
      console.error(e)
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

  private get needAuth(): boolean {
    return this.capabilities?.authentication === true
  }

  private async auth(password: string): Promise<boolean> {
    // if(!this.needAuth) {
    //     return true // no authentication required
    // }

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
      return false
    }
    this.authToken = await r.json() as IAuthToken
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
    do {
      password = await this.requirePassword(this.hostPort?.displayName ?? this.hostPort?.host)
      if (!password) {
        throw new BooError('cancel', 'password has not been set.')
      }
    } while (!await this.auth(password));
  }

  private async withAuthToken<T>(fn: (token?: string) => Promise<T>): Promise<T> {
    if (!this.needAuth) {
      return await fn()
    }
    while (true) {
      try {
        if (this.authToken) {
          const ret = await fn(this.authToken.token)
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

  async noop(): Promise<boolean> {
    if(this.capabilities?.authentication) {
      try {
        return await this.withAuthToken(async (token?: string) => {
          const url = this.baseUri + 'auth/' + (token ?? '')
          const r = await fetchWithTimeout(url, 3000)
          return (await (await this.handleResponseRaw(r)).text()).toLowerCase() === 'ok'
        })
      } catch (e) {
        logger.error(`re-auth failed: ${e}`)
        return false
      }
    } else {
      return true
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
    const url = this.baseUri + `chapter?id=${mediaId}`
    return await this.handleResponse<IChapterList>(await fetch(url))
  }

  getItemUrl(mediaItem: IMediaItem): string {
    let auth = ``
    if (this.needAuth && this.authToken) {
      auth = `&auth=${this.authToken.token}`
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

  async checkUpdate(): Promise<boolean> {
    throw new Error("Method not implemented.")
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

  async categories(): Promise<ICategory[]> {
    if (!this.capabilities?.category) {
      return []
    }
    const url = this.baseUri + 'categories'
    return await this.handleResponse<ICategory[]>(await fetch(url))
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