import test from "node:test";
import assert from "node:assert";
import { delay } from "../src/delay.js";

test("[async] delay", async function () {
  const start = new Date();
  const delayedPromise = delay(100);
  const result = await delayedPromise;
  const diff = new Date().getTime() - start.getTime();
  assert(result === undefined);
  assert(diff >= 100);
});

test("[async] delay with abort", async function () {
  const start = new Date();
  const abort = new AbortController();
  const { signal } = abort;
  const delayedPromise = delay(100, signal);
  setTimeout(() => abort.abort(), 0);
  await assert.rejects(() => delayedPromise, DOMException);
  const diff = new Date().getTime() - start.getTime();
  assert(diff < 100);
});
