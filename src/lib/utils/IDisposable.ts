export interface IDisposable {
  dispose(): void
}

/**
 * actionの戻り値を返す IDisposable のスコープを作成
 *
 * @param resource use が終わるとき (action の処理後) に dispose() が呼ばれます
 * @param action resource !== undefined のときに呼ばれる処理 (引数は resource)
 * @param actionIfNull  resource === undefined のときに呼ばれる処理
 *                      resourceがnullにならないことが確実なら不要。!resource && !actionIfNull)の場合は例外をスローする。
 */
export function use<T extends IDisposable, R>(
  resource: T | undefined,
  action: (r: T) => R,
  actionIfNull?: () => R): R {
  try {
    if (resource !== undefined) {
      return action(resource)
    } else if (actionIfNull !== undefined) {
      return actionIfNull()
    } else {
      throw new Error("resource is null")
    }
  } finally {
    resource?.dispose()
  }
}

/**
 * actionの戻り値を返す IDisposable のスコープを作成（async版）
 *
 * @param resource use が終わるとき (action の処理後) に dispose() が呼ばれます
 * @param action resource !== undefined のときに呼ばれる処理 (引数は resource)
 * @param actionIfNull  resource === undefined のときに呼ばれる処理
 *                      resourceがnullにならないことが確実なら不要。!resource && !actionIfNull)の場合は例外をスローする。
 */
export async function useAsync<T extends IDisposable, R>(
  resource: T | undefined,
  action: (r: T) => Promise<R>,
  actionIfNull?: () => Promise<R>): Promise<R> {
  try {
    if (resource !== undefined) {
      return await action(resource)
    } else if (actionIfNull !== undefined) {
      return await actionIfNull()
    } else {
      throw new Error("resource is null")
    }
  } finally {
    resource?.dispose()
  }
}
