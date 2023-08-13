import { Batcher, BatcherOptions } from './batcher';

type Method<K, V> = (keys: K[]) => Promise<V[]>;

class MethodBatcher<I, K, V> extends Batcher<K, V> {
  constructor(
    protected instance: I,
    protected method: Method<K, V>,
    options?: BatcherOptions
  ) {
    super(options);
  }

  run(keys: K[]): Promise<V[]> {
    return this.method.call(this.instance, keys);
  }
}

function getInstanceBatcher<K, V>(self: any, property: string, fn: Method<K, V>, options?: BatcherOptions) {
  const bkey = `${property}_____batcher`;

  // check if the instance already has a batcher for this method
  if (self[bkey]) return self[bkey];

  // otherwise, create a new batcher and store it in the instance so it is unique for that instance
  self[bkey] = new MethodBatcher(self, fn, options);
  return self[bkey];
}

export function InBatches<K, V>(options?: BatcherOptions) {
  return function (_: any, property: string, descriptor: PropertyDescriptor) {
    const fn = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const batcher = getInstanceBatcher<K, V>(this, property, fn, options);
      return batcher.enqueue(args);
    };

    return descriptor;
  };
}
