import { Deferred, deferred } from "./deferred.js";

interface TaggedYieldedValue<T> {
  iterator: AsyncIterator<T>;
  value: T;
}

export class MuxAsyncIterator<T> implements AsyncIterable<T> {
  #iteratorCount = 0;
  #yields: Array<TaggedYieldedValue<T>> = [];
  // deno-lint-ignore no-explicit-any
  #throws: any[] = [];
  #signal: Deferred<void> = deferred();

  add(iterable: AsyncIterable<T>) {
    ++this.#iteratorCount;
    this.#callIteratorNext(iterable[Symbol.asyncIterator]());
  }

  async #callIteratorNext(iterator: AsyncIterator<T>) {
    try {
      const { value, done } = await iterator.next();
      if (done) {
        --this.#iteratorCount;
      } else {
        this.#yields.push({ iterator, value });
      }
    } catch (e) {
      this.#throws.push(e);
    }
    this.#signal.resolve();
  }

  async *iterate(): AsyncIterableIterator<T> {
    while (this.#iteratorCount > 0) {
      // Sleep until any of the wrapped iterators yields.
      await this.#signal;

      // Note that while we're looping over `yields`, new items may be added.
      for (let i = 0; i < this.#yields.length; i++) {
        const { iterator, value } = this.#yields[i];
        yield value;
        this.#callIteratorNext(iterator);
      }

      if (this.#throws.length) {
        for (const e of this.#throws) {
          throw e;
        }
        this.#throws.length = 0;
      }
      // Clear the `yields` list and reset the `signal` promise.
      this.#yields.length = 0;
      this.#signal = deferred();
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.iterate();
  }
}
