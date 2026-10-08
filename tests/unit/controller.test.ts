import { expect, it, vi } from 'vitest';
import type { App } from '../../src/app';
import { PauseState } from '../../src/core/pause';
import { Session } from '../../src/game/session';
import { GameController } from '../../src/game/controller';
import { Store } from '../../src/core/store';
import { progressSchema, type Progress } from '../../src/game/save';
import { rules } from '../../src/game/rules';

function fixture(initial?: Progress) {
  const events: string[] = [];
  let raw = initial ? JSON.stringify({ version: 2, data: initial }) : null;
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
  game.update(rules.settleMs);
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
    best: perfects + 1,
    bestCombo: perfects,
    rounds: 1,
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
  expect(app.save.data).toEqual({ best: 30, bestCombo: 4, rounds: 2 });
  land(game, -100);
  expect(app.save.data).toEqual({ best: 30, bestCombo: 8, rounds: 3 });
  expect(game.result).toEqual({
    score: 15,
    combo: 8,
    best: 30,
    bestCombo: 8,
    newBest: false,
    newBestCombo: true,
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
  expect(app.save.data).toEqual({ best: 30, bestCombo: 8, rounds: 4 });
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
    expect(app.save.data).toEqual(progressSchema.defaults());
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
