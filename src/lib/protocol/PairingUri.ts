import type {IHostInfo} from "$lib/model/ModelDef"

export const PAIRING_SCHEME = "bootube"
export const DEFAULT_HTTPS_PORT = 3501
export const DEFAULT_HTTP_PORT = 3500

export interface IPairing {
  host: string
  port: number
  fingerprint?: string
  name: string
  serviceName?: string
  useSSL: boolean
}

export function parsePairingUri(input: string): IPairing | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch (_) {
    return null
  }
  if (url.protocol !== `${PAIRING_SCHEME}:`) return null
  const host = url.hostname
  if (!host) return null

  const useSSL = url.searchParams.get("https") === "1"
  const port = url.port
    ? Number(url.port)
    : (useSSL ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT)
  if (!Number.isFinite(port) || port <= 0 || port > 65535) return null

  const fp = url.searchParams.get("fp") ?? undefined
  const svc = url.searchParams.get("svc") ?? undefined
  const nameParam = url.searchParams.get("name")
  const name = nameParam && nameParam.length > 0 ? nameParam : host

  return {
    host,
    port,
    fingerprint: fp || undefined,
    name,
    serviceName: svc || undefined,
    useSSL,
  }
}

export function pairingToHostInfo(p: IPairing): IHostInfo {
  return {
    displayName: p.name,
    host: p.host,
    port: p.port,
    useSSL: p.useSSL,
    fingerprint: p.fingerprint,
    serviceName: p.serviceName,
  }
}
