export class Listeners<T> {
  private listeners: Array<(data: T) => void> = [];

  public addListener(listener: (data: T) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (data: T) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  public notify(data: T) {
    this.listeners.forEach((listener) => listener(data));
  }
}

export class UnitListeners {
  private listeners: Array<() => void> = [];

  public addListener(listener: () => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: () => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  public notify() {
    this.listeners.forEach((listener) => listener());
  }
}