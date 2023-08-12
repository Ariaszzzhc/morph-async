import assert from "node:assert";

export class RetryError extends Error {
  constructor(cause: unknown, attempts: number) {
    super(`Retrying exceeded the maxAttempts (${attempts}).`);
    this.name = "RetryError";
    this.cause = cause;
  }
}

export interface RetryOptions {
  /** How much to backoff after each retry. This is `2` by default. */
  multiplier?: number;
  /** The maximum milliseconds between attempts. This is `60000` by default. */
  maxTimeout?: number;
  /** The maximum amount of attempts until failure. This is `5` by default. */
  maxAttempts?: number;
  /** The initial and minimum amount of milliseconds between attempts. This is `1000` by default. */
  minTimeout?: number;
  /** Amount of jitter to introduce to the time between attempts. This is `1` for full jitter by default. */
  jitter?: number;
}

const defaultRetryOptions: Required<RetryOptions> = {
  multiplier: 2,
  maxTimeout: 60000,
  maxAttempts: 5,
  minTimeout: 1000,
  jitter: 1,
};

export async function retry<T>(
  fn: (() => Promise<T>) | (() => T),
  opts?: RetryOptions
) {
  const options: Required<RetryOptions> = {
    ...defaultRetryOptions,
    ...opts,
  };

  assert(options.maxTimeout >= 0, "maxTimeout is less than 0");
  assert(
    options.minTimeout <= options.maxTimeout,
    "minTimeout is greater than maxTimeout"
  );
  assert(options.jitter <= 1, "jitter is greater than 1");

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt + 1 >= options.maxAttempts) {
        throw new RetryError(error, options.maxAttempts);
      }

      const timeout = _exponentialBackoffWithJitter(
        options.maxTimeout,
        options.minTimeout,
        attempt,
        options.multiplier,
        options.jitter
      );
      await new Promise((r) => setTimeout(r, timeout));
    }
    attempt++;
  }
}

export function _exponentialBackoffWithJitter(
  cap: number,
  base: number,
  attempt: number,
  multiplier: number,
  jitter: number
) {
  const exp = Math.min(cap, base * multiplier ** attempt);
  return (1 - jitter * Math.random()) * exp;
}
