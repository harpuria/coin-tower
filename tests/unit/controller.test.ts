import { expect, it, vi } from 'vitest';
import type { App } from '../../src/app';
import { PauseState } from '../../src/core/pause';
import { Session } from '../../src/game/session';
import { GameController } from '../../src/game/controller';
import { Store } from '../../src/core/store';
import { progressSchema, type Progress } from '../../src/game/save';
import { failureRules } from '../../src/game/feedback';
import { rules } from '../../src/game/rules';
import { assetKeys } from '../../src/game/assets';

const progressDefaults = () => ({
  ...progressSchema.defaults(),
  onboardingComplete: true,
});

function fixture(
  initial?: Pick<Progress, 'best' | 'bestCombo' | 'rounds'>,
  onboardingComplete = true,
) {
  const events: string[] = [];
  let raw =
    initial || onboardingComplete
      ? JSON.stringify({
          version: 5,
          data: { ...progressDefaults(), ...initial, onboardingComplete },
        })
      : null;
  const storage = {
    getItem: () => raw,
    setItem: vi.fn((_key: string, value: string) => {
      raw = value;
    }),
    removeItem: () => {
      raw = null;
    },
  };
  const app = {
    ready: true,
    session: new Session(),
    pause: new PauseState(() => {}),
    onState: vi.fn(),
    onBackground: () => {},
    platform: {
      gameplayStart: () => events.push('start'),
      gameplayStop: () => events.push('stop'),
    },
    save: new Store(storage, 'save', progressSchema),
  };
  const controller = new GameController(app as unknown as App);
  return { app, controller, events, storage };
}

function land(game: GameController, offset = 0) {
  game.run.activeX = game.run.targetX + offset;
  game.tap();
  game.update(1000);
  game.update(
    game.run.mode === 'result' ? failureRules.durationMs : rules.settleMs,
  );
}

it.each([
  { best: 3, bestCombo: 2, newBest: false, newBestCombo: false },
  { best: 4, bestCombo: 3, newBest: false, newBestCombo: false },
  { best: 2, bestCombo: 2, newBest: true, newBestCombo: false },
  { best: 4, bestCombo: 1, newBest: false, newBestCombo: true },
  { best: 0, bestCombo: 0, newBest: true, newBestCombo: true },
])(
  'retains independent result flags against the previous best: %j',
  (previous) => {
    const { controller: game } = fixture({
      best: previous.best,
      bestCombo: previous.bestCombo,
      rounds: 1,
    });
    game.start();
    expect(game.result).toBeNull();
    for (let index = 0; index < 3; index++) land(game);
    land(game, -100);
    expect(game.result).toEqual({
      score: 3,
      combo: 2,
      best: Math.max(previous.best, 3),
      bestCombo: Math.max(previous.bestCombo, 2),
      newBest: previous.newBest,
      newBestCombo: previous.newBestCombo,
      shardsEarned: 3,
      shardsTotal: 3,
    });
    const completed = game.result;
    game.update(10_000);
    expect(game.result).toBe(completed);
    game.home();
    expect(game.result).toBeNull();
    game.start();
    land(game);
    land(game, -100);
    expect(game.result?.combo).toBe(0);
    expect(game.result?.newBestCombo).toBe(false);
    game.start();
    expect(game.result).toBeNull();
  },
);

it.each([0, 1])('records %i for a run with that many Perfects', (perfects) => {
  const { app, controller: game } = fixture();
  game.start();
  land(game);
  for (let index = 0; index < perfects; index++) land(game);
  land(game, -100);
  expect(app.save.data).toEqual({
    ...progressDefaults(),
    best: perfects + 1,
    bestCombo: perfects,
    rounds: 1,
    shards: perfects + 1,
  });
});

it('finalizes independent bests once at failure using the longest streak', () => {
  const {
    app,
    controller: game,
    storage,
  } = fixture({
    best: 30,
    bestCombo: 4,
    rounds: 2,
  });
  game.start();
  land(game);
  for (let index = 0; index < 8; index++) land(game);
  land(game, 35);
  for (let index = 0; index < 5; index++) land(game);
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(app.save.data).toEqual({
    ...progressDefaults(),
    best: 30,
    bestCombo: 4,
    rounds: 2,
    shards: 0,
  });
  land(game, -100);
  expect(app.save.data).toEqual({
    ...progressDefaults(),
    best: 30,
    bestCombo: 8,
    rounds: 3,
    shards: 15,
  });
  expect(game.result).toEqual({
    score: 15,
    combo: 8,
    best: 30,
    bestCombo: 8,
    newBest: false,
    newBestCombo: true,
    shardsEarned: 15,
    shardsTotal: 15,
  });
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  game.update(10_000);
  game.start();
  game.home();
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  expect(new Store(storage, 'save', progressSchema).data).toEqual(
    app.save.data,
  );
  game.start();
  land(game);
  land(game, -100);
  expect(app.save.data).toEqual({
    ...progressDefaults(),
    best: 30,
    bestCombo: 8,
    rounds: 4,
    shards: 16,
  });
});

it.each(['restart', 'home'] as const)(
  'discards both run metrics on confirmed %s',
  (action) => {
    const { app, controller: game, storage } = fixture();
    game.start();
    land(game);
    for (let index = 0; index < 8; index++) land(game);
    land(game, 35);
    game.pause();
    game.request(action);
    game.confirm(false);
    expect(game.run.maxCombo).toBe(8);
    game.request(action);
    game.confirm(true);
    expect(game.run.maxCombo).toBe(0);
    expect(app.save.data).toEqual(progressDefaults());
    expect(storage.setItem).not.toHaveBeenCalled();
  },
);

it('preserves both combos through background and countdown without saving early', () => {
  const { app, controller: game, storage } = fixture();
  game.start();
  land(game);
  for (let index = 0; index < 5; index++) land(game);
  app.onBackground();
  game.update(5000);
  game.resume();
  game.update(rules.resumeMs);
  expect(game.run.combo).toBe(5);
  expect(game.run.maxCombo).toBe(5);
  land(game);
  expect(game.run.maxCombo).toBe(6);
  expect(storage.setItem).not.toHaveBeenCalled();
  land(game, -100);
  expect(app.save.data.bestCombo).toBe(6);
});

it('reports actual play transitions once, including countdown, result and retry', () => {
  const { controller: game, events } = fixture();
  game.update(100);
  expect(events).toEqual([]);
  game.start();
  game.update(100);
  expect(events).toEqual(['start']);
  game.pause();
  game.pause();
  expect(events).toEqual(['start', 'stop']);
  game.request('restart');
  game.confirm(false);
  game.resume();
  game.update(2999);
  expect(events).toEqual(['start', 'stop']);
  game.update(1);
  game.update(1);
  expect(events).toEqual(['start', 'stop', 'start']);
  game.tap();
  game.update(1000); // 첫 동전은 넓은 받침 위에서 성공한다.
  game.update(1000);
  game.tap();
  game.update(1000);
  expect(game.run.mode).toBe('result');
  expect(events).toEqual(['start', 'stop', 'start', 'stop']);
  game.update(failureRules.durationMs);
  game.start();
  game.pause();
  game.request('restart');
  game.confirm(true);
  expect(events.slice(-3)).toEqual(['start', 'stop', 'start']);
  game.pause();
  game.request('home');
  game.confirm(true);
  expect(events.at(-1)).toBe('stop');
  expect(game.run.mode).toBe('menu');
});

it('leaves focus and visibility events to the SDK and reports only explicit resume', () => {
  const { app, controller: game, events } = fixture();
  game.start();
  app.pause.set('hidden', true);
  app.onBackground();
  app.pause.set('focus', true);
  app.onBackground();
  game.update(5000);
  expect(events).toEqual(['start']);
  app.pause.set('hidden', false);
  app.pause.set('focus', false);
  game.update(10);
  expect(game.run.paused).toBe(true);
  expect(events).toEqual(['start']);
  game.resume();
  game.update(3000);
  expect(events).toEqual(['start', 'start']);
  game.pause();
  game.resume();
  game.update(1000);
  app.onBackground();
  game.update(10000);
  expect(events).toEqual(['start', 'start', 'stop']);
  game.resume();
  game.update(3000);
  expect(events).toEqual(['start', 'start', 'stop', 'start']);
});

it('does not report starts before readiness or while backgrounded', () => {
  const { app, controller: game, events } = fixture();
  app.ready = false;
  game.start();
  expect(events).toEqual([]);
  app.ready = true;
  app.pause.set('focus', true);
  game.start();
  expect(game.run.paused).toBe(true);
  expect(events).toEqual([]);
});

it('completes hints on the fifth landing without finalizing an unfinished run', () => {
  const { app, controller: game, storage } = fixture(undefined, false);
  game.start();
  for (let i = 0; i < 4; i++) land(game);
  expect(app.save.data.onboardingComplete).toBe(false);
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(game.showHints).toBe(true);
  land(game);
  expect(app.save.data).toEqual(progressDefaults());
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  game.home();
  expect(new Store(storage, 'save', progressSchema).data).toEqual(
    progressDefaults(),
  );
});
it('repeats unfinished hints and skips them without dropping a coin', () => {
  const { app, controller: game } = fixture(undefined, false);
  game.start();
  land(game);
  land(game, 100);
  game.start();
  expect(game.showHints).toBe(true);
  game.skipHints();
  expect(game.run.phase).toBe('moving');
  expect(game.run.score).toBe(0);
  expect(app.save.data.onboardingComplete).toBe(true);
  expect(game.showHints).toBe(false);
});
it('keeps hint completion in-page and protects the source when saving fails', () => {
  const {
    app,
    controller: game,
    storage,
  } = fixture({ best: 53, bestCombo: 8, rounds: 12 }, false);
  const raw = storage.getItem();
  storage.setItem.mockImplementation(() => {
    throw new Error('quota');
  });
  game.start();
  game.skipHints();
  game.home();
  game.start();
  expect(game.showHints).toBe(false);
  expect(app.save.status).toBe('unavailable');
  expect(storage.getItem()).toBe(raw);
  expect(
    new Store(storage, 'save', progressSchema).data.onboardingComplete,
  ).toBe(false);
});
it('settles once before the result delay and permits purchases only after returning to menu', () => {
  const { app, controller: game, events } = fixture();
  app.save.update((data) => ({ ...data, shards: 49 }));
  app.save.flush();
  game.start();
  land(game);
  game.run.activeX = game.run.targetX - 100;
  game.tap();
  game.update(1000);
  const result = game.result;
  expect(game.run.resultReady).toBe(false);
  expect(game.run.failureDirection).toBe(-1);
  expect(app.save.data.rounds).toBe(1);
  expect(app.save.data.shards).toBe(50);
  expect(events).toEqual(['start', 'stop']);
  game.start();
  game.openSkins();
  expect(game.result).toBe(result);
  expect(game.skinsOpen).toBe(false);
  game.update(399);
  expect(game.run.resultReady).toBe(false);
  game.update(1);
  expect(game.run.resultReady).toBe(true);
  game.openSkins();
  expect(game.skinsOpen).toBe(false);
  expect(game.result).toBe(result);
  expect(game.result?.shardsEarned).toBe(1);
  game.update(5000);
  expect(app.save.data.rounds).toBe(1);
  expect(events).toEqual(['start', 'stop']);
  game.home();
  vi.spyOn(game.assets, 'isSkinReady').mockReturnValue(true);
  game.openSkins();
  game.selectSkin('silver');
  game.confirmSkinPurchase(true);
  game.closeSkins();
  expect(game.run.mode).toBe('menu');
  expect(app.save.data.equippedSkin).toBe('silver');
  expect(app.save.data.shards).toBe(0);
  expect(app.save.data.rounds).toBe(1);
  game.start();
  expect(game.runSkin).toBe('silver');
});

it('does not spend or equip an unavailable skin, including a lost-ready purchase confirmation', () => {
  const { app, controller: game } = fixture();
  app.save.update((data) => ({ ...data, shards: 50 }));
  game.openSkins();
  game.selectSkin('silver');
  expect(game.skinPurchase).toBeNull();
  expect(app.save.data.shards).toBe(50);
  const ready = vi.spyOn(game.assets, 'isSkinReady').mockReturnValue(true);
  game.selectSkin('silver');
  expect(game.skinPurchase).toBe('silver');
  ready.mockReturnValue(false);
  game.confirmSkinPurchase(true);
  expect(app.save.data.shards).toBe(50);
  expect(app.save.data.ownedSkins).toEqual(['gold']);
  expect(app.save.data.equippedSkin).toBe('gold');
  ready.mockReturnValue(true);
  game.selectSkin('silver');
  game.confirmSkinPurchase(true);
  expect(app.save.data.shards).toBe(0);
  expect(app.save.data.equippedSkin).toBe('silver');
});

it('stops music before the one failure sound and does not replay it during result updates', () => {
  const { app, controller: game } = fixture();
  const audio = { playMusic: vi.fn(), stopMusic: vi.fn(), sfx: vi.fn() };
  Object.assign(app, { audio });
  game.start();
  land(game);
  land(game, -100);
  const failure = audio.sfx.mock.calls.findIndex(
    ([key]) => key === assetKeys.failure,
  );
  expect(failure).toBeGreaterThanOrEqual(0);
  expect(audio.stopMusic.mock.invocationCallOrder[0]).toBeLessThan(
    audio.sfx.mock.invocationCallOrder[failure]!,
  );
  game.update(5000);
  game.update(5000);
  expect(
    audio.sfx.mock.calls.filter(([key]) => key === assetKeys.failure),
  ).toHaveLength(1);
});
