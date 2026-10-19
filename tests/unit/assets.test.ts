import { EventEmitter } from 'node:events';
import type Phaser from 'phaser';
import { expect, it, vi } from 'vitest';
import { queueAssets, resolveBackgroundTextures } from '../../src/game/assets';
import { DeferredAssets } from '../../src/game/deferred-assets';

it('gates first play on the equipped skin without loading later backgrounds or other skins', () => {
  const load = { setPath: vi.fn(), image: vi.fn(), audio: vi.fn() };
  queueAssets(load as unknown as Phaser.Loader.LoaderPlugin, 'ruby');
  const keys = load.image.mock.calls.map(([key]) => key);
  expect(keys).toContain('coin');
  expect(keys).toContain('coinRuby');
  expect(keys).not.toContain('coinSilver');
  expect(keys).not.toContain('coinEmerald');
  expect(keys).not.toContain('backgroundNoon');
  expect(keys).not.toContain('backgroundEvening');
  expect(keys).not.toContain('backgroundNight');
  expect(load.audio.mock.calls.map(([key]) => key)).toEqual([
    'stack',
    'music',
    'failure',
  ]);
});

function fixture() {
  const ready = new Set(['coin', 'background']);
  const frames = new Set<string>();
  const textures = {
    exists: (key: string) => ready.has(key),
    get: (key: string) => ({
      has: () => frames.has(key),
      add: () => frames.add(key),
    }),
  };
  let loading = false;
  const load = Object.assign(new EventEmitter(), {
    setPath: vi.fn(),
    image: vi.fn(),
    start: vi.fn(() => {
      loading = true;
    }),
    isLoading: () => loading,
  });
  const changed = vi.fn();
  const assets = new DeferredAssets(changed);
  const attach = () =>
    assets.attach(
      load as unknown as Phaser.Loader.LoaderPlugin,
      textures as unknown as Phaser.Textures.TextureManager,
    );
  return { ready, frames, load, changed, assets, attach };
}

it('waits for an explicit request, deduplicates it and installs a usable skin frame before publishing readiness', () => {
  const { assets, attach, ready, load, frames } = fixture();
  attach();
  expect(load.image).not.toHaveBeenCalled();
  assets.requestSkins();
  assets.prefetch();
  assets.prefetch();
  expect(load.image).toHaveBeenCalledTimes(6);
  expect(load.start).toHaveBeenCalledOnce();
  expect(assets.isSkinReady('gold')).toBe(true);
  expect(assets.isSkinReady('silver')).toBe(false);
  ready.add('coinSilver');
  load.emit('filecomplete', 'coinSilver');
  expect(assets.isSkinReady('silver')).toBe(true);
  expect(frames.has('coinSilver')).toBe(true);
});

it('keeps optional failures retryable without marking a skin ready, and detaches late callbacks', () => {
  const { assets, attach, load, ready, changed } = fixture();
  assets.requestSkins(); // 시작 가능 표시와 Scene.create 사이의 요청도 보존한다.
  attach();
  load.emit('loaderror', { key: 'coinRuby' });
  expect(assets.skinFailed('ruby')).toBe(true);
  expect(assets.hasSkinFailures).toBe(true);
  expect(assets.isSkinReady('ruby')).toBe(false);
  assets.requestSkins();
  expect(
    load.image.mock.calls.filter(([key]) => key === 'coinRuby'),
  ).toHaveLength(1);
  assets.retry();
  expect(
    load.image.mock.calls.filter(([key]) => key === 'coinRuby'),
  ).toHaveLength(2);
  ready.add('coinRuby');
  load.emit('filecomplete', 'coinRuby');
  expect(assets.isSkinReady('ruby')).toBe(true);
  expect(assets.hasSkinFailures).toBe(false);
  assets.detach();
  changed.mockClear();
  load.emit('filecomplete', 'coinEmerald');
  expect(changed).not.toHaveBeenCalled();
  expect(load.listenerCount('filecomplete')).toBe(0);
  expect(load.listenerCount('loaderror')).toBe(0);
});

it('never resolves a missing background texture, while preserving the normal transition when ready', () => {
  const ready = new Set(['background']);
  const has = (key: string) => ready.has(key);
  expect(
    resolveBackgroundTextures({ from: 'morning', to: 'noon' }, has),
  ).toEqual({ base: 'background', next: 'background', changing: false });
  ready.add('backgroundNoon');
  expect(
    resolveBackgroundTextures({ from: 'morning', to: 'noon' }, has),
  ).toEqual({ base: 'background', next: 'backgroundNoon', changing: true });
  expect(
    resolveBackgroundTextures({ from: 'noon', to: 'evening' }, has),
  ).toEqual({
    base: 'backgroundNoon',
    next: 'backgroundNoon',
    changing: false,
  });
});
