import { isRecord, type Schema } from '../core/store';

export interface Progress {
  best: number;
  bestCombo: number;
  rounds: number;
  shards: number;
}

const isCount = (n: unknown): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;

export const progressSchema: Schema<Progress> = {
  version: 3,
  defaults: () => ({ best: 0, bestCombo: 0, rounds: 0, shards: 0 }),
  validate: (v): v is Progress =>
    isRecord(v) && [v.best, v.bestCombo, v.rounds, v.shards].every(isCount),
  migrations: {
    1: (value) => {
      // 구버전에 없던 콤보 기록은 추정하지 않고 0에서 시작한다.
      if (!isRecord(value) || ![value.best, value.rounds].every(isCount))
        throw new Error('Invalid v1 progress');
      return { best: value.best, bestCombo: 0, rounds: value.rounds };
    },
    2: (value) => {
      if (
        !isRecord(value) ||
        ![value.best, value.bestCombo, value.rounds].every(isCount)
      )
        throw new Error('Invalid v2 progress');
      return {
        best: value.best,
        bestCombo: value.bestCombo,
        rounds: value.rounds,
        shards: 0,
      };
    },
  },
};
