import { describe, expect, it } from 'vitest';
import { Store, type StoragePort } from '../../src/core/store';
import { progressSchema } from '../../src/game/save';

class MemoryStorage implements StoragePort {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe('versioned persistence', () => {
  it('saves and reloads a validated independent snapshot', () => {
    const storage = new MemoryStorage();
    const store = new Store(storage, 'save', progressSchema);
    store.update(() => ({ best: 4, bestCombo: 2, rounds: 1 }));
    expect(store.flush()).toBe(true);
    expect(new Store(storage, 'save', progressSchema).data).toEqual({
      best: 4,
      bestCombo: 2,
      rounds: 1,
    });
    const copy = store.data as { best: number; rounds: number };
    copy.best = 50;
    expect(store.data.best).toBe(4);
  });
  it.each([
    'invalid JSON',
    '{"version":1,"data":{"best":-1,"rounds":0}}',
    '{"version":1,"data":{"best":8}}',
    '{"version":2,"data":{"best":8,"rounds":2}}',
    '{"version":2,"data":{"best":8,"bestCombo":-1,"rounds":2}}',
    '{"version":2,"data":{"best":8,"bestCombo":1.5,"rounds":2}}',
    '{"version":99,"data":{"best":8,"rounds":2}}',
    'null',
  ])('protects unreadable original data: %s', (raw) => {
    const storage = new MemoryStorage();
    storage.setItem('save', raw);
    const store = new Store(storage, 'save', progressSchema);
    store.update(() => ({ best: 1, bestCombo: 0, rounds: 1 }));
    expect(store.flush()).toBe(false);
    expect(storage.getItem('save')).toBe(raw);
    expect(store.reset()).toBe(true);
    expect(new Store(storage, 'save', progressSchema).data).toEqual(
      progressSchema.defaults(),
    );
  });
  it('migrates step by step then writes the new envelope', () => {
    const storage = new MemoryStorage();
    storage.setItem('save', JSON.stringify({ version: 1, data: 8 }));
    const store = new Store(storage, 'save', {
      ...progressSchema,
      version: 3,
      migrations: {
        1: (value) => ({ best: value }),
        2: (value) => ({ ...(value as object), bestCombo: 0, rounds: 0 }),
      },
    });
    expect(store.data).toEqual({ best: 8, bestCombo: 0, rounds: 0 });
    expect(store.flush()).toBe(true);
    expect(JSON.parse(storage.getItem('save')!).version).toBe(3);
  });
  it('protects a save with a missing migration', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'save',
      JSON.stringify({ version: 1, data: { best: 9, rounds: 1 } }),
    );
    const store = new Store(storage, 'save', {
      ...progressSchema,
      migrations: {},
    });
    expect(store.status).toBe('corrupt');
    expect(store.flush()).toBe(false);
  });
  it('keeps gameplay usable when storage access is denied', () => {
    const store = new Store(undefined, 'save', progressSchema);
    expect(store.update(() => ({ best: 2, bestCombo: 1, rounds: 1 }))).toBe(
      false,
    );
    expect(store.data.best).toBe(2);
    expect(store.flush()).toBe(false);
    expect(store.reset()).toBe(false);
  });
  it('reports a quota error without claiming persistence', () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new Error('QuotaExceeded');
    };
    const store = new Store(storage, 'save', progressSchema);
    store.update(() => ({ best: 1, bestCombo: 0, rounds: 1 }));
    expect(store.flush()).toBe(false);
    expect(store.status).toBe('unavailable');
  });
  it('resets progress without touching settings', () => {
    const storage = new MemoryStorage();
    storage.setItem('settings', 'keep');
    new Store(storage, 'save', progressSchema).reset();
    expect(storage.getItem('settings')).toBe('keep');
  });
  it('migrates actual v1 height and rounds without inventing a combo record', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'save',
      JSON.stringify({ version: 1, data: { best: 30, rounds: 12 } }),
    );
    const store = new Store(storage, 'save', progressSchema);
    expect(store.status).toBe('ready');
    expect(store.data).toEqual({ best: 30, bestCombo: 0, rounds: 12 });
    expect(store.flush()).toBe(true);
    expect(JSON.parse(storage.getItem('save')!)).toEqual({
      version: 2,
      data: { best: 30, bestCombo: 0, rounds: 12 },
    });
    expect(new Store(storage, 'save', progressSchema).data).toEqual(store.data);
  });
});
