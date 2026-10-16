import { isRecord, type Schema } from '../core/store';
import { isSkinId, type SkinId } from './skins';

export interface Progress {
  best: number;
  bestCombo: number;
  rounds: number;
  shards: number;
  ownedSkins: SkinId[];
  equippedSkin: SkinId;
  onboardingComplete: boolean;
}

const isCount = (n: unknown): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;

const validCollection = (
  v: unknown,
): v is Omit<Progress, 'onboardingComplete'> =>
  isRecord(v) &&
  [v.best, v.bestCombo, v.rounds, v.shards].every(isCount) &&
  Array.isArray(v.ownedSkins) &&
  v.ownedSkins.every(isSkinId) &&
  new Set(v.ownedSkins).size === v.ownedSkins.length &&
  v.ownedSkins.includes('gold') &&
  isSkinId(v.equippedSkin) &&
  v.ownedSkins.includes(v.equippedSkin);

export const progressSchema: Schema<Progress> = {
  version: 5,
  defaults: () => ({
    best: 0,
    bestCombo: 0,
    rounds: 0,
    shards: 0,
    ownedSkins: ['gold'],
    equippedSkin: 'gold',
    onboardingComplete: false,
  }),
  validate: (v): v is Progress =>
    isRecord(v) &&
    typeof v.onboardingComplete === 'boolean' &&
    validCollection(v),
  migrations: {
    4: (value) => {
      if (!validCollection(value)) throw new Error('Invalid v4 progress');
      return { ...value, onboardingComplete: false };
    },
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
    3: (value) => {
      if (
        !isRecord(value) ||
        ![value.best, value.bestCombo, value.rounds, value.shards].every(
          isCount,
        )
      )
        throw new Error('Invalid v3 progress');
      return {
        best: value.best,
        bestCombo: value.bestCombo,
        rounds: value.rounds,
        shards: value.shards,
        ownedSkins: ['gold'],
        equippedSkin: 'gold',
      };
    },
  },
};
