# Async Helpers

this project currently is a port of deno std async libs for nodejs

# Docs

## delay

```typescript
import { delay } from "@morph/asyncs";

const delayedPromise = delay(100);
const result = await delayedPromise;
```

## deferred

```typescript
import { deferred } from "@morph/asyncs";

const p = deferred<number>();
// ...
p.resolve(42);
```

## abortable

```typescript
import { abortable, delay } from "@morph/asyncs";

const p = delay(1000);
const c = new AbortController();
setTimeout(() => c.abort(), 100);

// Below throws `DOMException` after 100 ms
await abortable(p, c.signal);
```

## deadline

```typescript
import { deadline, delay } from "@morph/asyncs";

const delayedPromise = delay(1000);
// Below throws `DeadlineError` after 10 ms
const result = await deadline(delayedPromise, 10);
```

## MuxAsyncIterator

```typescript
import { MuxAsyncIterator } from "@morph/asyncs";

async function* gen123(): AsyncIterableIterator<number> {
  yield 1;
  yield 2;
  yield 3;
}

async function* gen456(): AsyncIterableIterator<number> {
  yield 4;
  yield 5;
  yield 6;
}

const mux = new MuxAsyncIterator<number>();
mux.add(gen123());
mux.add(gen456());
for await (const value of mux) {
  // ...
}
```

## retry

```typescript
import { retry } from "@morph/asyncs";
const req = async () => {
  // some function that throws sometimes
};

// Below resolves to the first non-error result of `req`
const retryPromise = await retry(req, {
  multiplier: 2,
  maxTimeout: 60000,
  maxAttempts: 5,
  minTimeout: 100,
  jitter: 1,
});
```

```typescript
import { retry } from "@morph/asyncs";
const req = async () => {
  // some function that throws sometimes
};

// Make sure we wait at least 1 minute, but at most 2 minutes
const retryPromise = await retry(req, {
  multiplier: 2.34,
  maxTimeout: 80000,
  maxAttempts: 7,
  minTimeout: 1000,
  jitter: 0.5,
});
```
