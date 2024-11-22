export class Lazy<T> {
  private _value: T | undefined = undefined;
  private _getter: () => T;

  constructor(getter: () => T) {
    this._getter = getter;
  }

  get value(): T {
    if(this._value === undefined) {
      this._value = this._getter();
    }
    return this._value;
  }
}

