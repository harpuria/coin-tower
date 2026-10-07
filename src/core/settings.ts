import { isRecord, type Schema } from './store';

export interface Settings {
  muted: boolean;
  master: number;
  music: number;
  sfx: number;
  reducedMotion: boolean;
}

export function settingsSchema(reducedMotion = false): Schema<Settings> {
  return {
    version: 1,
    defaults: () => ({
      muted: false,
      master: 0.7,
      music: 0.35,
      sfx: 0.6,
      reducedMotion,
    }),
    validate: (v): v is Settings =>
      isRecord(v) &&
      typeof v.muted === 'boolean' &&
      typeof v.reducedMotion === 'boolean' &&
      [v.master, v.music, v.sfx].every(
        (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1,
      ),
  };
}
