import { InBatches } from './decorator';

class RunInBatches {
  constructor(private id: string = '') {
  }


  async getAll(keys: string): Promise<string>;

  @InBatches()
  async getAll(keys: string | string[]): Promise<string | string[]> {
    if (Array.isArray(keys)) {
      return keys.map((key, index) => `${key}-index-${index}-${this.id}`);
    }
    throw new Error('Should not be called with single key');
  }

  async getCouple(keys: string): Promise<string>;

  @InBatches({ maxBatchSize: 2 })
  async getCouple(keys: string | string[]): Promise<string | string[]> {
    if (Array.isArray(keys)) {
      return keys.map((key, index) => `${key}-index-${index}-${this.id}`);
    }
    throw new Error('Should not be called with single key');
  }
}

describe('Batch Decorator', () => {
  it('should call method in batches', async () => {
    const runner = new RunInBatches('i1');

    const promises = ['a', 'b', 'c'].map(key => {
      return runner.getAll(key);
    });

    const values = await Promise.all(promises);
    expect(values).toEqual(['a-index-0-i1', 'b-index-1-i1', 'c-index-2-i1']);
  });

  it('should call method in batches for distinct instances', async () => {
    const runner1 = new RunInBatches('i1');
    const runner2 = new RunInBatches('i2');

    const promises1 = ['a', 'b', 'c'].map(key => {
      return runner1.getAll(key);
    });

    const promises2 = ['d', 'e', 'f'].map(key => {
      return runner2.getAll(key);
    });

    const values1 = await Promise.all(promises1);
    expect(values1).toEqual(['a-index-0-i1', 'b-index-1-i1', 'c-index-2-i1']);

    const values2 = await Promise.all(promises2);
    expect(values2).toEqual(['d-index-0-i2', 'e-index-1-i2', 'f-index-2-i2']);
  });

  it('should call method in batches with max size', async () => {
    const runner = new RunInBatches('i1');

    const promises = ['batch1.1', 'batch1.2', 'batch2'].map(key => {
      return runner.getCouple(key);
    });

    const values = await Promise.all(promises);
    expect(values).toEqual(['batch1.1-index-0-i1', 'batch1.2-index-1-i1', 'batch2-index-0-i1']);
  });
});
