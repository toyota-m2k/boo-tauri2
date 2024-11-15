export type OSName = "Windows" | "Linux" | "MacOS" | "Unknown";

export interface IEnv {
  osName: OSName;
  isMac: boolean;
  isWin: boolean;
}

class Env implements IEnv {
  osName: OSName;

  constructor() {
    if (navigator.userAgent.indexOf("Win") != -1) {
      this.osName = "Windows";
    } else if (navigator.userAgent.indexOf("Linux") != -1) {
      this.osName = "Linux";
    } else if (navigator.userAgent.indexOf("Mac") != -1) {
      this.osName = "MacOS";
    } else {
      this.osName = "Unknown";
    }
  }

  get isMac(): boolean {
    return this.osName === "MacOS";
  }
  get isWin(): boolean {
    return this.osName === "Windows";
  }
}

export const env: IEnv = new Env();