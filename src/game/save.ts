import { isRecord, type Schema } from '../core/store';

export interface Progress {
  best: number;
  rounds: number;
}
export const progressSchema: Schema<Progress> = {
  version: 1,
  defaults: () => ({ best: 0, rounds: 0 }),
  validate: (v): v is Progress =>
    isRecord(v) &&
    [v.best, v.rounds].every(
      (n) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0,
    ),
};
