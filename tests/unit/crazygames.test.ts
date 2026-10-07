import { afterEach, expect, it, vi } from 'vitest';
import {
  CrazyGamesIntegration,
  crazyGamesSdkUrl,
  type CrazyGamesSdk,
  type CrazyGamesSettings,
} from '../../src/services/crazygames';
import { PlatformServices } from '../../src/services/platform';
import { AudioService } from '../../src/core/audio';
import { settingsSchema } from '../../src/core/settings';
import type Phaser from 'phaser';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function sdkFixture(muted = false) {
  const listeners = new Set<(settings: CrazyGamesSettings) => void>();
  const sdk: CrazyGamesSdk = {
    init: vi.fn(async () => {}),
    environment: 'local',
    game: {
      settings: { muteAudio: muted },
      gameplayStart: vi.fn(),
      gameplayStop: vi.fn(),
      addSettingsChangeListener: vi.fn((listener) => {
        listeners.add(listener);
      }),
      removeSettingsChangeListener: vi.fn((listener) => {
        listeners.delete(listener);
      }),
    },
  };
  vi.stubGlobal('window', { CrazyGames: { SDK: sdk } });
  return {
    sdk,
    listeners,
    change: (muteAudio: boolean) =>
      listeners.forEach((listener) => listener({ muteAudio })),
  };
}

it('awaits initialization once before using settings or reporting play', async () => {
  const { sdk } = sdkFixture(true);
  let finish!: () => void;
  vi.mocked(sdk.init).mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const integration = new CrazyGamesIntegration();
  const pending = integration.initialize();
  expect(integration.initialize()).toBe(pending);
  integration.gameplayStart();
  expect(sdk.game.gameplayStart).not.toHaveBeenCalled();
  expect(sdk.game.addSettingsChangeListener).not.toHaveBeenCalled();
  finish();
  await pending;
  expect(sdk.init).toHaveBeenCalledOnce();
  expect(integration.muted).toBe(true);
  integration.gameplayStart();
  integration.gameplayStop();
  expect(sdk.game.gameplayStart).toHaveBeenCalledOnce();
  expect(sdk.game.gameplayStop).toHaveBeenCalledOnce();
  integration.destroy();
});

it('uses initial and changing platform mute without changing the user preference', async () => {
  const { change, listeners } = sdkFixture(true);
  const sound = {
    mute: false,
    volume: 1,
    pauseAll: vi.fn(),
    resumeAll: vi.fn(),
  };
  const settings = settingsSchema().defaults();
  const audio = new AudioService(
    sound as unknown as Phaser.Sound.BaseSoundManager,
    settings,
  );
  const integration = new CrazyGamesIntegration();
  integration.onMute = (muted) => audio.setPlatformMuted(muted);
  await integration.initialize();
  expect(sound.mute).toBe(true);
  audio.apply(settings);
  expect(sound.mute).toBe(true);
  change(false);
  expect(sound.mute).toBe(false);
  audio.apply({ ...settings, muted: true });
  change(true);
  change(false);
  expect(sound.mute).toBe(true);
  audio.apply(settings);
  audio.suspend(true);
  change(true);
  change(false);
  expect(sound.mute).toBe(true);
  audio.suspend(false);
  expect(sound.mute).toBe(false);
  expect(settings.muted).toBe(false);
  integration.destroy();
  expect(listeners.size).toBe(0);
  change(true);
  expect(sound.mute).toBe(false);
});

it('rejects disabled or rejected initialization without attaching settings or sending events', async () => {
  for (const disabled of [true, false]) {
    const { sdk } = sdkFixture();
    if (disabled) Object.assign(sdk, { environment: 'disabled' });
    else vi.mocked(sdk.init).mockRejectedValue(new Error('init failed'));
    const integration = new CrazyGamesIntegration();
    await expect(integration.initialize()).rejects.toThrow();
    integration.gameplayStart();
    expect(sdk.game.addSettingsChangeListener).not.toHaveBeenCalled();
    expect(sdk.game.gameplayStart).not.toHaveBeenCalled();
    integration.destroy();
  }
});

it('times out initialization and ignores late completion', async () => {
  vi.useFakeTimers();
  const { sdk } = sdkFixture();
  let finish!: () => void;
  vi.mocked(sdk.init).mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const integration = new CrazyGamesIntegration();
  const rejection = expect(integration.initialize(50)).rejects.toThrow(
    'cancelled',
  );
  await vi.advanceTimersByTimeAsync(50);
  await rejection;
  finish();
  await Promise.resolve();
  expect(sdk.game.addSettingsChangeListener).not.toHaveBeenCalled();
  integration.gameplayStart();
  expect(sdk.game.gameplayStart).not.toHaveBeenCalled();
  integration.destroy();
});

it('cancels a pending initialization on disposal', async () => {
  const { sdk } = sdkFixture();
  vi.mocked(sdk.init).mockImplementation(() => new Promise<void>(() => {}));
  const integration = new CrazyGamesIntegration();
  const rejection = expect(integration.initialize()).rejects.toThrow(
    'cancelled',
  );
  integration.destroy();
  await rejection;
  expect(sdk.game.addSettingsChangeListener).not.toHaveBeenCalled();
});

it.each(['load', 'error', 'missing'] as const)(
  'loads the official v3 URL and handles %s',
  async (outcome) => {
    const { sdk } = sdkFixture();
    const host = {
      CrazyGames: undefined as { SDK: CrazyGamesSdk } | undefined,
    };
    vi.stubGlobal('window', host);
    const script = {
      src: '',
      async: false,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      remove: vi.fn(),
    };
    vi.stubGlobal('document', {
      createElement: () => script,
      head: {
        append: () => {
          expect(script.src).toBe(crazyGamesSdkUrl);
          if (outcome === 'error') script.onerror!();
          else {
            if (outcome === 'load') host.CrazyGames = { SDK: sdk };
            script.onload!();
          }
        },
      },
    });
    const integration = new CrazyGamesIntegration();
    if (outcome === 'load') await integration.initialize();
    else await expect(integration.initialize()).rejects.toThrow();
    expect(script.remove).toHaveBeenCalled();
    expect(script.onload).toBeNull();
    expect(script.onerror).toBeNull();
    integration.destroy();
  },
);

it('keeps standalone offline and hides fullscreen for a CrazyGames target even before readiness', async () => {
  const options = {
    development: false,
    mock: false,
    ads: false,
    billing: false,
    analytics: false,
  };
  const standalone = new PlatformServices(options);
  await standalone.initialize();
  standalone.gameplayStart();
  standalone.gameplayStop();
  expect(standalone.hideFullscreen).toBe(false);
  expect(standalone.muted).toBe(false);
  standalone.destroy();
  const { sdk } = sdkFixture();
  const cg = new PlatformServices({ ...options, crazygames: true });
  expect(cg.hideFullscreen).toBe(true);
  await cg.initialize();
  cg.gameplayStart();
  expect(sdk.game.gameplayStart).toHaveBeenCalledOnce();
  expect(await cg.rewarded()).toEqual({ status: 'unavailable' });
  expect(await cg.purchase('test')).toEqual({ status: 'unavailable' });
  expect(cg.track('test')).toBe(false);
  cg.destroy();
});

it('contains runtime SDK event exceptions', async () => {
  const { sdk } = sdkFixture();
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const integration = new CrazyGamesIntegration();
  await integration.initialize();
  vi.mocked(sdk.game.gameplayStart).mockImplementation(() => {
    throw new Error('lost connection');
  });
  expect(() => integration.gameplayStart()).not.toThrow();
  expect(warning).toHaveBeenCalledOnce();
  integration.destroy();
  warning.mockRestore();
});
