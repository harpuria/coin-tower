import { describe, expect, it } from 'vitest';
import { landingKind, rules } from '../../src/game/rules';
import { Session } from '../../src/game/session';

function land(run: Session, x = run.targetX) {
  run.activeX = x;
  expect(run.drop()).toBe(true);
  const event = run.update(1000);
  if (event === 'landed') run.update(rules.settleMs);
  return event;
}

describe('landing outcomes', () => {
  it.each([-1, 1])(
    'includes both pedestal boundaries and rejects the outside (%s)',
    (side) => {
      expect(landingKind(360 + side * rules.platformRadius, 360, true)).toBe(
        'nice',
      );
      expect(
        landingKind(360 + side * (rules.platformRadius + 0.001), 360, true),
      ).toBe('miss');
    },
  );
  it.each([-1, 1])(
    'includes success/Perfect boundaries without widening them (%s)',
    (side) => {
      const success = rules.diameter * rules.successFraction;
      const perfect = rules.diameter * rules.perfectFraction;
      expect(landingKind(300 + side * success, 300, false)).toBe('nice');
      expect(landingKind(300 + side * (success + 0.001), 300, false)).toBe(
        'miss',
      );
      expect(landingKind(300 + side * perfect, 300, false)).toBe('perfect');
      expect(landingKind(300 + side * (perfect + 0.001), 300, false)).toBe(
        'nice',
      );
    },
  );
});

describe('a run', () => {
  it('locks the dropped x, discards extra input, and keeps the landed location', () => {
    const run = new Session();
    expect(run.drop()).toBe(false);
    run.start();
    run.update(230);
    const x = run.activeX;
    expect(run.drop()).toBe(true);
    expect(run.drop()).toBe(false);
    run.update(100);
    expect(run.activeX).toBe(x);
    expect(run.score).toBe(0);
    expect(run.update(300)).toBe('landed');
    expect(run.score).toBe(1);
    expect(run.targetX).toBe(x);
    expect(run.streak).toBe(0);
    expect(run.drop()).toBe(false);
    run.update(rules.settleMs);
    expect(run.phase).toBe('moving');
    expect(run.activeX).toBe(360 + rules.laneHalfWidth);
  });
  it('allows the first coin anywhere along the whole movement lane', () => {
    for (const side of [-1, 1]) {
      const run = new Session();
      run.start();
      expect(land(run, 360 + side * rules.laneHalfWidth)).toBe('landed');
      expect(run.score).toBe(1);
    }
  });
  it('ends on the first miss, excludes it from score, and never completes twice', () => {
    const run = new Session();
    run.start();
    land(run, 250);
    expect(land(run, 400)).toBe('finished');
    expect(run.mode).toBe('result');
    expect(run.score).toBe(1);
    expect(run.drop()).toBe(false);
    expect(run.update(10_000)).toBeUndefined();
    expect(run.score).toBe(1);
  });
  it('keeps offsets as the next target and gives one point per success', () => {
    const run = new Session();
    run.start();
    land(run, 240);
    land(run, 280);
    expect(run.score).toBe(2);
    expect(run.targetX).toBe(280);
    expect(run.coins.map((coin) => coin.x)).toEqual([240, 280]);
  });
  it('caps combo display at x4 and resets on ordinary success, miss, and restart', () => {
    const run = new Session();
    run.start();
    land(run);
    expect(run.feedback).toBe('nice');
    for (let index = 0; index < 6; index++) land(run);
    expect(run.streak).toBe(6);
    expect(run.combo).toBe(4);
    expect(run.score).toBe(7);
    land(run, run.targetX + 35);
    expect(run.streak).toBe(0);
    land(run);
    expect(run.streak).toBe(1);
    land(run, run.targetX - 100);
    expect(run.streak).toBe(0);
    run.start();
    expect(run.score).toBe(0);
    expect(run.combo).toBe(0);
    expect(run.cameraOffset).toBe(0);
    expect(run.speed).toBe(rules.baseSpeed);
    expect(run.direction).toBe(1);
  });
  it('changes speed only on spawning and moves the camera only while settling', () => {
    const run = new Session();
    run.start();
    run.activeX = run.targetX;
    run.drop();
    run.update(100);
    expect(run.cameraOffset).toBe(0);
    run.update(300);
    expect(run.speed).toBe(rules.baseSpeed);
    expect(run.cameraOffset).toBe(0);
    run.update(rules.settleMs / 2);
    expect(run.cameraOffset).toBeCloseTo(rules.coinHeight / 2);
    run.update(rules.settleMs / 2);
    expect(run.cameraOffset).toBe(rules.coinHeight);
    expect(run.speed).toBe(rules.baseSpeed + rules.speedPerCoin);
    for (let index = 1; index < 22; index++) land(run);
    expect(run.speed).toBe(rules.maxSpeed);
    const offset = run.cameraOffset;
    run.update(100);
    expect(run.cameraOffset).toBe(offset);
  });
  it.each(['moving', 'dropping', 'settling'] as const)(
    'preserves %s through pause and a full countdown',
    (phase) => {
      const run = new Session();
      run.start();
      run.update(100);
      if (phase !== 'moving') run.drop();
      if (phase === 'settling') {
        run.update(1000);
        run.update(50);
      }
      run.pause();
      const before = run.snapshot();
      run.update(5000);
      expect(run.snapshot()).toEqual(before);
      expect(run.drop()).toBe(false);
      run.resume();
      for (const remaining of [2000, 1000, 0]) {
        run.update(1000);
        expect(run.countdownMs).toBe(remaining);
        expect(run.activeX).toBe(before.activeX);
        expect(run.activeY).toBe(before.activeY);
        expect(run.cameraOffset).toBe(before.cameraOffset);
      }
      expect(run.phase).toBe(phase);
      run.update(10);
      expect(run.snapshot()).not.toEqual(before);
    },
  );
  it('restarts the countdown on a new interruption and confirms abandonment', () => {
    const run = new Session();
    run.start();
    land(run);
    run.pause();
    run.resume();
    run.update(1500);
    run.pause();
    expect(run.countdownMs).toBe(0);
    run.resume();
    expect(run.countdownMs).toBe(rules.resumeMs);
    run.pause();
    run.request('restart');
    run.confirm(false);
    expect(run.score).toBe(1);
    expect(run.paused).toBe(true);
    run.request('restart');
    run.confirm(true);
    expect(run.score).toBe(0);
    expect(run.paused).toBe(false);
    expect(run.confirmation).toBe(null);
    run.pause();
    run.request('home');
    run.confirm(true);
    expect(run.mode).toBe('menu');
  });
  it('reflects movement even across multiple boundaries in one update', () => {
    const run = new Session();
    run.start();
    run.update(30_000);
    expect(run.activeX).toBeGreaterThanOrEqual(360 - rules.laneHalfWidth);
    expect(run.activeX).toBeLessThanOrEqual(360 + rules.laneHalfWidth);
  });
});
