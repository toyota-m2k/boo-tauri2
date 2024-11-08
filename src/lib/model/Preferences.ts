import {logger} from "$lib/model/DebugLog.svelte";

export class Preferences {
  private static readonly SETTINGS_FILE = 'settings.json'
  // private static readonly USER_DIR = "user"

  private readonly fileName: string
  private settings: Record<string, unknown> = {}
  private dirty = false

  constructor(fileName: string=Preferences.SETTINGS_FILE) {
    this.fileName = fileName
  }

  public async load(): Promise<void> {
    // const data = await tauriEx.readJson(this.fileName)
    // if (data) {
    //   this.settings = JSON.parse(data)
    //   this.dirty = false
    // }
    // else
    {
      logger.error('Failed to load settings.json')
      this.dirty = true
      this.settings = {
        hostInfoList: [
          {
            displayName: "2F-MakibaO-Boo",
            host: "192.168.0.151",
            port: 3500
          },
          {
            displayName: "2F-MakibaO-SA",
            host: "192.168.0.151",
            port: 3800
          },
          {
            displayName: "1F-TamayoPtx-Boo",
            host: "192.168.0.152",
            port: 3500
          },
          {
            displayName: "1F-TamayoPtx-SA",
            host: "192.168.0.152",
            port: 3800
          },
        ],
        currentHostIndex: 0,
      }
    }
  }

  public async save(force:boolean=false): Promise<void> {
    if(!this.dirty && !force) return
    // if(!await tauriEx.writeJson(this.fileName, JSON.stringify(this.settings))) {
    //   logger.error('Failed to save settings.json')
    // }

    logger.info("Settings saved.")
    this.dirty = false
    return
  }

  public get<T>(key: string, defaultValue: T): T {
    return this.settings[key] as T ?? defaultValue
  }

  public set<T>(key: string, value: T): void {
    this.settings[key] = value
    this.dirty = true
  }

  public get isModified(): boolean {
    return this.dirty
  }
}