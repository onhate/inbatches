# @InBatches(📦,📦,📦,...)

InBatches is a zero-dependency generic TypeScript library that provides a convenient way to batch executions that runs
asynchronous.

It is designed to be used as part of your application's data fetching layer to provide a consistent API over various
backends and reduce requests to those backends via batching.

This library is especially useful for scenarios where you need to perform multiple asynchronous operations efficiently,
such as when making network requests or performing database queries.

Heavily inspired by [graphql/dataloader](https://github.com/graphql/dataloader) but simpler using decorators (😜 really
decoupled). Because of that the
rest of your application doesn't event need to know about the batching/dataloader, it just works!

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Basic usage with `@InBatches` Decorator](#basic-usage-with-inbatches-decorator)
    - [Advanced usage with custom `Batcher` class](#advanced-usage-with-custom-batcher-class)
- [API](#api)
    - [`BatcherOptions`](#batcheroptions)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install inbatches
```

or

```bash
yarn add inbatches
```

## Usage

### Basic usage with `@InBatches` Decorator

The simplest way to get the grown running is to use the `@InBatches` decorator. This decorator will wrap your method
and will batch-enable it, like magic! 🧙‍♂️

```typescript
import { InBatches } from 'inbatches';

class MyService {

  // (optional) overloaded method, where you define the keys as `number` and the return type as `User` for typings
  async fetch(key: number): Promise<User>;

  // This method is now batch-enabled
  @InBatches()
  async fetch(keys: number | number[]): Promise<User | User[]> {
    if (Array.isArray(keys)) return await this.db.getMany(keys);

    // in reality the Decorator will wrap this method and it will never be called with a single key :)
    throw new Error('It will never be called with a single key 😉');
  }
}
```

Profit! 🤑

```typescript
const service = new MyService();

const result = [1, 2, 3, 4, 5].map(async id => {
  return await service.fetch(id);
});

// The result will be an array of results in the same order as the keys
result.then(results => {
  console.log(results); // Output: [{ id: 1, name: 'Result for key 1' }, ...]
});
```

### Advanced usage with custom `Batcher` class

Another way to use the library is to create a class that extends the `Batcher` class and implement the `run` method.
This class will provide a `enqueue` method that you can use to enqueue keys for batched execution.

```typescript
import { Batcher } from 'inbatches';

// The `run` method will be called with an array of keys collected from the `enqueue` method
class MyBatcher extends Batcher<number, string> {
  async run(ids: number[]): Promise<string[]> {
    // Perform asynchronous operations using the keys
    // you must return an array of results in the same order as the keys
    return this.db.getMany(ids);
  }
}
```

then

```typescript
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

## API

### `BatcherOptions`

An interface to specify options for the batcher.

- `maxBatchSize`: The maximum number of keys to batch together. Default is `25`.
- `delayWindowInMs`: (not recommended) The delay window in milliseconds before dispatching the batch. Default
  is `undefined` and will use `process.nextTick` to dispatch the batch, which is highly efficient and fast. Only use
  this if you really want to accumulate promises calls in a window of time before dispatching the batch.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on
the [GitHub repository](https://github.com/onhate/inbatches).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.