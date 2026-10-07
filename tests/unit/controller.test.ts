import { expect, it, vi } from 'vitest';
import type { App } from '../../src/app';
import { PauseState } from '../../src/core/pause';
import { Session } from '../../src/game/session';
import { GameController } from '../../src/game/controller';

function fixture() {
  const events: string[] = [];
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
    save: { update: vi.fn(), flush: () => true },
  };
  const controller = new GameController(app as unknown as App);
  return { app, controller, events };
}

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
