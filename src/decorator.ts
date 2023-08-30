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

// this Symbol is used to store the MethodBatcher instances in the instance of the class that is using the decorator
// this way we can have a unique batcher for each instance and method of the class decorated with @InBatches
const holder = Symbol('__inbatches__');

function getInstanceBatcher<I, K, V>(instance: I, property: string, descriptor: Method<K, V>, options?: BatcherOptions) {
  // check if the instance already has a holder for all the batchers in the class
  instance[holder] = instance[holder] ?? new Map<string, MethodBatcher<I, K, V>>();

  // check if the instance already has a method matcher for this specific method
  if (instance[holder].has(property)) return instance[holder].get(property) as MethodBatcher<I, K, V>;

  // otherwise, create a new batcher and store it in the instance batchers holder
  const batcher = new MethodBatcher<I, K, V>(instance, descriptor, options);
  instance[holder].set(property, batcher);
  return batcher;
}

export function InBatches<K, V>(options?: BatcherOptions) {
  return function (_: any, property: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = function (key: K) {
      const batcher = getInstanceBatcher<any, K, V>(this, property, method, options);
      return batcher.enqueue(key);
    };

    return descriptor;
  };
}
