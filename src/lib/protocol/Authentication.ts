import {HashBuilder} from "../utils/Hash";

interface IAuthentication {
  challengeFromResponse(res: Response): Promise<string>

  authTokenFromResponse(res: Response): Promise<string>

  string2Uint8Array(str: string): Uint8Array

  createPassPhrase(password: string, challenge: string): string
}

const PWD_SEED = "y6c46S/PBqd1zGFwghK2AFqvSDbdjl+YL/DKXgn/pkECj0x2fic5hxntizw5"

class Authentication implements IAuthentication {
  public async challengeFromResponse(res: Response): Promise<string> {
    if (res.status != 401 || res.headers.get("Content-Type") != "application/json") {
      throw new Error("unknown response from the server.")
    }
    return (await res.json()).challenge as string
  }

  public async authTokenFromResponse(res: Response): Promise<string> {
    if (res.status != 200 || res.headers.get("Content-Type") != "application/json") {
      throw new Error("unknown response from the server.")
    }
    return (await res.json()).token as string
  }

  public string2Uint8Array(str: string): Uint8Array {
    return new TextEncoder().encode(str)
  }


  public createPassPhrase(password: string, challenge: string): string {
    const hb = new HashBuilder()
    hb.update(PWD_SEED)
    hb.update(password)
    const hashedPassword = hb.build().hexHash
    hb.update(hashedPassword)
    hb.update(challenge)
    return hb.build().base64Hash
  }
}

export const authentication: IAuthentication = new Authentication()