# InBatches (📦📦📦)

InBatches is a TypeScript library that provides a convenient way to batch and execute asynchronous operations in a
controlled manner. This library is especially useful for scenarios where you need to perform multiple asynchronous
operations efficiently, such as when making network requests or performing database queries.

Heavily inspired by [graphql/dataloader](https://github.com/graphql/dataloader) but better 😜

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Basic Usage](#basic-usage)
    - [Using the `InBatches` Decorator](#using-the-inbatches-decorator)
- [API](#api)
    - [`BatcherOptions`](#batcheroptions)
    - [`Batcher<K, V>` Class](#batcherk-v-class)
    - [`InBatches<K, V>` Decorator](#inbatchesk-v-decorator)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install inbatches
```

## Usage

### Basic Usage

```typescript
import { Batcher } from 'inbatches';

// Define a class that extends Batcher and implements the `run` method
class MyBatcher extends Batcher<number, string> {
  async run(keys: number[]): Promise<string[]> {
    // Perform asynchronous operations using the keys
    return await Promise.all(keys.map(async key => {
      return `Result for key ${key}`;
    }));
  }
}

// Create an instance of your batcher
const batcher = new MyBatcher();

// Enqueue keys for batching and execution
const resultPromise1 = batcher.enqueue(1);
const resultPromise2 = batcher.enqueue(2);

resultPromise1.then(result => {
  console.log(result); // Output: "Result for key 1"
});

resultPromise2.then(result => {
  console.log(result); // Output: "Result for key 2"
});
```

### Using the `InBatches` Decorator

The library also provides a decorator called `InBatches` that you can use to batch-enable methods of your class.

```typescript
import { InBatches } from 'batcher';

class MyService {
  @InBatches<number, string>()
  async fetchResults(keys: number | number[]): Promise<string | string[]> {
    // This method is now batch-enabled
    // Perform asynchronous operations using the keys
    if (Array.isArray(keys)) {
      return await Promise.all(keys.map(async key => {
        // Perform some asynchronous operation using `key`
        return `Result for key ${key}`;
      }));
    }

    throw new Error('It will never be called with a single key 😉');
  }
}

const service = new MyService();

// Enqueue keys for batching and execution
const resultPromise1 = service.fetchResults(1);
const resultPromise2 = service.fetchResults(2);

resultPromise1.then(results => {
  console.log(results); // Output: "Result for key 1"
});

resultPromise2.then(results => {
  console.log(results); // Output: "Result for key 2"
});
```

## API

### `BatcherOptions`

An interface to specify options for the batcher.

- `maxBatchSize`: The maximum number of keys to batch together. Default is `25`.
- `delayWindowInMs`: The delay window in milliseconds before dispatching the batch. Default is `undefined`.

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