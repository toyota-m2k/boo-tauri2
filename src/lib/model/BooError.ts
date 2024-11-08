type ErrorReason = "auth" | "cancel" | "generic"

export class BooError extends Error {
  reason: ErrorReason

  constructor(reason: ErrorReason, message: string) {
    super(message);
    this.name = "BooError";
    this.reason = reason;
  }

  static isBooError(e: unknown): e is BooError {
    return e instanceof BooError
  }
}