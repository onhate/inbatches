import { Batcher, BatcherOptions } from './batcher';

class RunInBatches extends Batcher<string, string> {
  constructor(options?: BatcherOptions) {
    super(options);
  }

  async run(keys: string[]): Promise<(string | Error)[]> {
    return keys.map((key, index) => {
      if (key === 'throw') throw new Error(`throw-index-${index}`);
      if (key === 'error') return new Error(`error-index-${index}`);
      return `${key}-index-${index}`;
    });
  }
}

describe('Batcher', () => {
  it('should call run in batch', async () => {
    const batcher = new RunInBatches();

    const promises = ['a', 'b', 'c'].map(key => {
      return batcher.enqueue(key);
    });

    const values = await Promise.all(promises);
    expect(values).toEqual(['a-index-0', 'b-index-1', 'c-index-2']);
  });

  it('should call run in batch with max size', async () => {
    const batcher = new RunInBatches({ maxBatchSize: 2 });

    const promises = ['batch1.1', 'batch1.2', 'batch2.1', 'batch2.2'].map(key => {
      return batcher.enqueue(key);
    });

    const values = await Promise.all(promises);
    expect(values).toEqual(['batch1.1-index-0', 'batch1.2-index-1', 'batch2.1-index-0', 'batch2.2-index-1']);
  });

  it('should call run method with unique keys if duplicates', async () => {
    const batcher = new RunInBatches();

    const promises = ['a', 'b', 'a', 'c'].map(key => {
      return batcher.enqueue(key);
    });

    const values = await Promise.all(promises);
    expect(values).toEqual(['a-index-0', 'b-index-1', 'a-index-0', 'c-index-2']);
  });

  it('should reject all with same error when run method failed', async () => {
    const batcher = new RunInBatches();

    const promises = ['a', 'throw', 'c'].map(key => {
      return batcher.enqueue(key);
    });

    const actual = await Promise.allSettled(promises);
    const error = new Error('throw-index-1');
    expect(actual[0]).toEqual({ status: 'rejected', reason: error });
    expect(actual[1]).toEqual({ status: 'rejected', reason: error });
    expect(actual[2]).toEqual({ status: 'rejected', reason: error });
  });

  it('should reject single with returned error when returning error', async () => {
    const batcher = new RunInBatches();

    const promises = ['a', 'error', 'c'].map(key => {
      return batcher.enqueue(key);
    });

    const actual = await Promise.allSettled(promises);
    expect(actual[0]).toEqual({ status: 'fulfilled', value: 'a-index-0' });
    expect(actual[1]).toEqual({ status: 'rejected', reason: new Error('error-index-1') });
    expect(actual[2]).toEqual({ status: 'fulfilled', value: 'c-index-2' });
  });

  it('should call in batches with delay', cb => {
    const batcher = new RunInBatches({ delayWindowInMs: 100 });

    const promises = ['a', 'b', 'c'].map(key => {
      return batcher.enqueue(key);
    });

    setTimeout(() => {
      promises.push(batcher.enqueue('d'));
      promises.push(batcher.enqueue('e'));
      promises.push(batcher.enqueue('f'));
    }, 50);

    setTimeout(() => {
      promises.push(batcher.enqueue('g'));
      promises.push(batcher.enqueue('h'));
      promises.push(batcher.enqueue('i'));
    }, 105);

    setTimeout(async () => {
      const values = await Promise.all(promises);
      expect(values).toEqual([
        // batch 1
        'a-index-0',
        'b-index-1',
        'c-index-2',
        'd-index-3',
        'e-index-4',
        'f-index-5',
        // batch 2
        'g-index-0',
        'h-index-1',
        'i-index-2'
      ]);
      cb();
    }, 120);
  });
});
