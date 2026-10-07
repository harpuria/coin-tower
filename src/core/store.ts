export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Schema<T> {
  version: number;
  defaults: () => T;
  validate: (value: unknown) => value is T;
  /** Key is the source version; each migration advances exactly one version. */
  migrations?: Record<number, (value: unknown) => unknown>;
}

export type StoreStatus =
  'ready' | 'corrupt' | 'future-version' | 'unavailable';

export class Store<T> {
  private value: T;
  private dirty = false;
  status: StoreStatus = 'ready';

  constructor(
    private storage: StoragePort | undefined,
    private key: string,
    private schema: Schema<T>,
  ) {
    this.value = schema.defaults();
    this.load();
  }

  get data(): Readonly<T> {
    return structuredClone(this.value);
  }

  private load() {
    if (!this.storage) {
      this.status = 'unavailable';
      return;
    }
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.key);
    } catch {
      this.status = 'unavailable';
      return;
    }
    if (raw === null) return;
    try {
      const envelope = JSON.parse(raw) as { version: number; data: unknown };
      if (
        !envelope ||
        !Number.isInteger(envelope.version) ||
        envelope.version < 1
      )
        throw new Error('Invalid version');
      if (envelope.version > this.schema.version) {
        this.status = 'future-version';
        return;
      }
      let { version, data } = envelope;
      while (version < this.schema.version) {
        const migrate = this.schema.migrations?.[version];
        if (!migrate) throw new Error('Missing migration');
        data = migrate(data);
        version++;
      }
      if (!this.schema.validate(data)) throw new Error('Invalid save');
      this.value = data;
      this.dirty = envelope.version !== version;
    } catch {
      this.status = 'corrupt';
    }
  }

  update(change: (current: T) => T): boolean {
    const next = change(structuredClone(this.value));
    if (!this.schema.validate(next)) throw new Error('Invalid store update');
    this.value = structuredClone(next);
    this.dirty = true;
    return this.status === 'ready';
  }

  flush(): boolean {
    if (this.status !== 'ready') return false;
    if (!this.dirty) return true;
    try {
      this.storage!.setItem(
        this.key,
        JSON.stringify({ version: this.schema.version, data: this.value }),
      );
      this.dirty = false;
      return true;
    } catch {
      this.status = 'unavailable';
      return false;
    }
  }

  /** Destructive recovery: call only after an explicit user reset action. */
  reset(): boolean {
    try {
      if (!this.storage) return false;
      this.storage.removeItem(this.key);
      this.value = this.schema.defaults();
      this.status = 'ready';
      this.dirty = true;
      return this.flush();
    } catch {
      this.status = 'unavailable';
      return false;
    }
  }
}

export function browserStorage(): StoragePort | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
