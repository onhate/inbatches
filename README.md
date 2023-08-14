# @InBatches(📦,📦,📦,...)

InBatches is a zero-dependency generic TypeScript library that provides a convenient way to batch executions that runs
asynchronous.

It is designed to be used as part of your application's data fetching layer to provide a consistent API over various
backends and reduce requests to those backends via batching.

This library is especially useful for scenarios where you need to perform multiple asynchronous operations efficiently,
such as when making network requests or performing database queries.

Heavily inspired by [graphql/dataloader](https://github.com/graphql/dataloader) but using classes and decorators 😜

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Basic Usage](#basic-usage)
    - [Using the `@InBatches` Decorator](#using-the-inbatches-decorator)
- [API](#api)
    - [`BatcherOptions`](#batcheroptions)
    - [`Batcher<K, V>` Class](#batcherk-v-class)
    - [`InBatches<K, V>` Decorator](#inbatches-decorator)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install inbatches
```

## Usage

### Using the `Batcher` Class

```typescript
import { Batcher } from 'inbatches';

// Define a class that extends Batcher and implements the `run` method
// the `run` method will be called with an array of keys collected from the `enqueue` method
class MyBatcher extends Batcher<number, string> {
  async run(ids: number[]): Promise<string[]> {
    // Perform asynchronous operations using the keys
    // you must return an array of results in the same order as the keys
    return this.db.getMany(ids);
  }
}

// Create an instance of your batcher
const batcher = new MyBatcher();

// Enqueue keys for batched execution
const result = [1, 2, 3, 4, 5].map(async id => {
  return await batcher.enqueue(id);
});

// The result will be an array of results in the same order as the keys
result.then(results => {
  console.log(results); // Output: [{ id: 1, name: 'Result for key 1' }, ...]
});
```

### Using the `@InBatches` Decorator

The library also provides a decorator called `InBatches` that you can use to batch-enable methods of your class.

```typescript
import { InBatches } from 'inbatches';

class MyService {

  // (optional) overloaded method, where you define the keys as `number` and the return type as `string` for typings
  async fetch(keys: number): Promise<string>;

  // in reality the Decorator will wrap this method and it will never be called with a single key :)
  @InBatches() // This method is now batch-enabled
  async fetch(keys: number | number[]): Promise<string | string[]> {
    if (Array.isArray(keys)) {
      return this.db.getMany(keys);
    }

    // the Decorator will wrap this method and because of that it will never be called with a single key
    throw new Error('It will never be called with a single key 😉');
  }
}

const service = new MyService();

const result = [1, 2, 3, 4, 5].map(async id => {
  return await service.fetch(id);
});

// The result will be an array of results in the same order as the keys
result.then(results => {
  console.log(results); // Output: [{ id: 1, name: 'Result for key 1' }, ...]
});
```

## API

### `BatcherOptions`

An interface to specify options for the batcher.

- `maxBatchSize`: The maximum number of keys to batch together. Default is `25`.
- `delayWindowInMs`: (not recommended) The delay window in milliseconds before dispatching the batch. Default
  is `undefined` and will use `process.nextTick` to dispatch the batch, which is highly efficient and fast. Only use
  this if you really want to accumulate promises calls in a window of time before dispatching the batch.

### `Batcher<K, V>` Class

An abstract class that provides the core functionality for batching and executing asynchronous operations.

- `enqueue(key: K): Promise<V>`: Enqueues a key for batching and returns a promise that resolves to the result when
  available.

### `InBatches` Decorator

A decorator function that can be applied to methods to enable batching.

- Usage: `@InBatches(options?: BatcherOptions)`
- Example:

```typescript
class MyService {

  // (optional) overloaded method, where you define the keys as `number` and the return type as `string` for typings
  async fetchResults(keys: number): Promise<string>
  
  @InBatches({ maxBatchSize: 10 })
  async fetchResults(keys: number | number[]): Promise<string | string[]> {
    // Batch-enabled method logic
  }
}
```
  
## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on
the [GitHub repository](https://github.com/onhate/inbatches).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.