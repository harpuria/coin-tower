import { expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { AudioService } from '../../src/core/audio';
import { settingsSchema } from '../../src/core/settings';

// 소리 서비스의 단위 검사는 브라우저 전용 Phaser 초기화 없이 실행한다.
vi.mock('phaser', () => ({
  default: { Sound: { Events: { COMPLETE: 'complete' } } },
}));

it('pauses and resumes all game sounds while preserving the chosen mute setting', () => {
  const sound = {
    mute: false,
    volume: 0,
    pauseAll: vi.fn(),
    resumeAll: vi.fn(),
  };
  const settings = settingsSchema().defaults();
  const audio = new AudioService(
    sound as unknown as Phaser.Sound.BaseSoundManager,
    settings,
  );
  audio.suspend(true);
  expect(sound.pauseAll).toHaveBeenCalledOnce();
  expect(sound.mute).toBe(true);
  audio.apply({ ...settings, muted: true });
  audio.suspend(false);
  expect(sound.resumeAll).toHaveBeenCalledOnce();
  expect(sound.mute).toBe(true);
  audio.apply(settings);
  expect(sound.mute).toBe(false);
});
