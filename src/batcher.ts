export interface BatcherOptions {
  maxBatchSize?: number;
  delayWindowInMs?: number;
}

interface Execution<K> {
  key: K;
  resolve: Function;
  reject: Function;
}

class Batch<K, V> {
  public active = true;
  public readonly cache = new Map<K, Promise<V>>();
  public readonly executions: Execution<K>[] = [];

  append(key: K) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const promise = new Promise<V>((resolve, reject) => {
      this.executions.push({ key, resolve, reject });
    });

    this.cache.set(key, promise);
    return promise;
  }
}

const isomorphicNextTick =
  typeof window !== 'undefined' && window.document
    ? typeof setImmediate !== 'undefined'
      ? setImmediate
      : setTimeout
    : eval('process.nextTick');

const defaultOptions: BatcherOptions = { maxBatchSize: 25 };

export abstract class Batcher<K, V> {
  private static readonly promise = Promise.resolve();
  private current: Batch<K, V> = undefined;

  protected constructor(protected options?: BatcherOptions) {
    this.options = { ...defaultOptions, ...options };
  }

  abstract run(keys: K[]): Promise<(V | Error)[]>;

  enqueue(key: K): Promise<V> {
    return this.getCurrentBatch().append(key);
  }

  private getCurrentBatch() {
    // if there is a current batch, and it has not been dispatched, and it is not full
    if (this.current) {
      if (this.current.active && this.current.executions.length < this.options.maxBatchSize) {
        return this.current;
      }
    }

    // create and schedule to dispatch
    const batch = new Batch<K, V>();
    this.scheduleBatch(() => {
      this.dispatch(batch);
    });

    // set as current
    this.current = batch;
    return this.current;
  }

  private scheduleBatch(fn: Function) {
    Batcher.promise.then(() => {
      if (this.options.delayWindowInMs > 0) {
        return setTimeout(fn, this.options.delayWindowInMs);
      }
      return isomorphicNextTick(fn);
    });
  }

  private dispatch(batch: Batch<K, V>) {
    batch.active = false;

    if (batch.executions.length === 0) {
      return;
    }

    try {
      this.run(batch.executions.map(callback => callback.key))
        .then(values => this.fulfill(batch, values))
        .catch(error => this.reject(batch, error));
    } catch (error) {
      this.reject(batch, error);
    }
  }

  private fulfill(batch: Batch<K, V>, values: (V | Error)[]) {
    batch.executions.forEach((callback, index) => {
      const value = values[index];
      if (value instanceof Error) callback.reject(value);
      else callback.resolve(value);
    });
  }

  private reject(batch: Batch<K, V>, error: Error) {
    batch.executions.forEach(callback => {
      callback.reject(error);
    });
  }
}
