import { delay } from "./delay.js";

export class DeadlineError extends Error {
  constructor() {
    super("Deadline");
    this.name = this.constructor.name;
  }
}

export function deadline<T>(p: Promise<T>, ms: number): Promise<T>;
export function deadline<T>(
  p: Promise<T>,
  ms: number,
  signal: AbortSignal
): Promise<T>;

export function deadline<T>(
  p: Promise<T>,
  ms: number,
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  if (signal?.aborted) {
    return Promise.reject(new DeadlineError());
  }
  signal?.addEventListener("abort", () => controller.abort(signal.reason));
  const d = delay(ms, controller.signal)
    .catch(() => {}) // Do NOTHING on abort.
    .then(() => Promise.reject(new DeadlineError()));
  return Promise.race([p.finally(() => controller.abort()), d]);
}
