import {createHash} from "sha256-uint8array";

export class HashBuilder {
  encoder = new TextEncoder()
  creator = createHash()
  hash: Uint8Array | undefined


  toUint8Array(str: string): Uint8Array {
    return this.encoder.encode(str)
  }

  update(str: string): HashBuilder {
    if (this.hash) {
      this.hash = undefined
      this.creator = createHash()
    }
    this.creator.update(this.toUint8Array(str))
    return this
  }

  build(): HashBuilder {
    this.hash = this.creator.digest()
    return this
  }

  get hexHash(): string {
    if (!this.hash) return ""
    return Array.from(this.hash).map((v) => v.toString(16).padStart(2, "0")).join("")
  }

  get base64Hash(): string {
    if (!this.hash) return ""
    return btoa(String.fromCharCode(...this.hash))
  }
}