import { describe, expect, it } from 'vitest';
import {
  cameraZoom,
  landingKind,
  moveSpeed,
  rules,
} from '../../src/game/rules';
import { Session } from '../../src/game/session';
import { isMilestone, milestoneRules } from '../../src/game/feedback';

function land(run: Session, x = run.targetX) {
  run.activeX = x;
  expect(run.drop()).toBe(true);
  const event = run.update(1000);
  if (event === 'landed') run.update(rules.settleMs);
  return event;
}

describe('landing outcomes', () => {
  it.each([-1, 1])(
    'allows 45 percent drift while keeping Perfect at 10 percent (%s)',
    (side) => {
      expect(rules.successFraction).toBe(0.45);
      expect(rules.perfectFraction).toBe(0.1);
      expect(landingKind(360 + side * 166 * 0.4, 360, false)).toBe('nice');
      expect(landingKind(360 + side * 166 * 0.45, 360, false)).toBe('nice');
      expect(landingKind(360 + side * (166 * 0.45 + 0.001), 360, false)).toBe(
        'miss',
      );
      expect(landingKind(360 + side * 166 * 0.1, 360, false)).toBe('perfect');
      expect(landingKind(360 + side * (166 * 0.1 + 0.001), 360, false)).toBe(
        'nice',
      );
    },
  );
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
  it('displays the full streak and preserves the run maximum through NICE and failure', () => {
    const run = new Session();
    run.start();
    land(run);
    expect(run.feedback).toBe('nice');
    for (let index = 0; index < 100; index++) land(run);
    expect(run.streak).toBe(100);
    expect(run.combo).toBe(100);
    expect(run.maxCombo).toBe(100);
    expect(run.score).toBe(101);
    land(run, run.targetX + 35);
    expect(run.streak).toBe(0);
    expect(run.maxCombo).toBe(100);
    land(run);
    expect(run.streak).toBe(1);
    expect(run.maxCombo).toBe(100);
    land(run, run.targetX - 100);
    expect(run.streak).toBe(0);
    expect(run.maxCombo).toBe(100);
    run.start();
    expect(run.score).toBe(0);
    expect(run.combo).toBe(0);
    expect(run.maxCombo).toBe(0);
    expect(run.cameraOffset).toBe(0);
    expect(run.speed).toBe(rules.baseSpeed);
    expect(run.direction).toBe(1);
  });
  it('keeps the longest streak, not the last streak or total Perfects', () => {
    const run = new Session();
    run.start();
    land(run);
    expect(run.maxCombo).toBe(0);
    for (let index = 0; index < 8; index++) land(run);
    land(run, run.targetX + 35);
    for (let index = 0; index < 5; index++) land(run);
    expect(run.combo).toBe(5);
    expect(run.maxCombo).toBe(8);
    run.pause();
    run.update(5000);
    run.resume();
    run.update(rules.resumeMs);
    expect(run.combo).toBe(5);
    expect(run.maxCombo).toBe(8);
    land(run);
    expect(run.combo).toBe(6);
    land(run, run.targetX - 100);
    expect(run.combo).toBe(0);
    expect(run.maxCombo).toBe(8);
    run.home();
    expect(run.maxCombo).toBe(0);
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
    expect(run.speed).toBeGreaterThan(650);
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

describe('gentle late-run difficulty', () => {
  it.each([
    [0, 350, 1],
    [20, 650, 1],
    [40, 750, 0.95],
    [60, 808.4962500721156, 0.9],
    [100, 882.1928094887362, 0.9],
  ])('uses the agreed curve at %s coins', (score, speed, zoom) => {
    expect(moveSpeed(score)).toBeCloseTo(speed, 8);
    expect(cameraZoom(score)).toBeCloseTo(zoom, 8);
  });
  it('continues beyond 100 with a decreasing gain and a fixed zoom floor', () => {
    expect(moveSpeed(20.000001) - moveSpeed(20)).toBeLessThan(0.00001);
    for (const score of [21, 40, 60, 100, 200, 1000]) {
      expect(moveSpeed(score)).toBeGreaterThan(moveSpeed(score - 1));
      expect(moveSpeed(score + 1) - moveSpeed(score)).toBeLessThan(
        moveSpeed(score) - moveSpeed(score - 1),
      );
      expect(cameraZoom(score)).toBeGreaterThanOrEqual(0.9);
    }
    expect(cameraZoom(1000)).toBe(0.9);
  });
  it('interpolates zoom only while settling, freezes it and resets after completion', () => {
    const run = new Session();
    run.start();
    for (let i = 0; i < 20; i++) land(run);
    expect(run.zoom).toBe(1);
    run.activeX = run.targetX;
    run.drop();
    run.update(1000);
    expect(run.zoom).toBe(1);
    expect(run.speed).toBe(650);
    run.update(rules.settleMs / 2);
    expect(run.zoom).toBeCloseTo(0.99875, 8);
    run.pause();
    const held = run.snapshot();
    run.update(5000);
    expect(run.snapshot()).toEqual(held);
    run.resume();
    run.update(rules.resumeMs);
    expect(run.zoom).toBe(held.zoom);
    run.update(rules.settleMs / 2);
    expect(run.zoom).toBeCloseTo(0.9975, 8);
    const zoom = run.zoom;
    const speed = run.speed;
    run.update(100);
    run.drop();
    run.update(100);
    expect(run.zoom).toBe(zoom);
    expect(run.speed).toBe(speed);
    // 현재 목표에서 실패를 만들고 결과에서 배율을 유지한다.
    run.activeX = run.targetX + 100;
    run.update(1000);
    expect(run.mode).toBe('result');
    run.update(5000);
    expect(run.zoom).toBe(zoom);
    run.start();
    expect(run.zoom).toBe(1);
    expect(run.speed).toBe(350);
    for (let i = 0; i < 61; i++) land(run);
    expect(run.zoom).toBe(0.9);
    run.home();
    expect(run.zoom).toBe(1);
  });
});

describe('height milestones', () => {
  it.each([
    [9, false],
    [10, true],
    [25, true],
    [50, true],
    [75, false],
    [100, true],
    [150, true],
    [175, false],
    [200, true],
  ])('treats %i coins as a milestone: %s', (score, expected) => {
    expect(isMilestone(score)).toBe(expected);
  });

  it('celebrates on landing, freezes while paused and clears on failure and reset', () => {
    const run = new Session();
    run.start();
    for (let index = 0; index < 9; index++) land(run);
    expect(run.milestoneRemaining).toBe(0);
    land(run);
    expect(run.score).toBe(10);
    expect(run.milestone).toBe(10);
    const remaining = run.milestoneRemaining;
    expect(remaining).toBe(milestoneRules.durationMs - rules.settleMs);
    run.pause();
    run.update(500);
    expect(run.milestoneRemaining).toBe(remaining);
    run.resume();
    run.update(rules.resumeMs);
    run.update(100);
    expect(run.milestoneRemaining).toBe(remaining - 100);
    run.activeX = run.targetX + rules.diameter;
    run.drop();
    expect(run.update(1000)).toBe('finished');
    expect(run.milestoneRemaining).toBe(0);
    run.start();
    expect(run.milestone).toBe(0);
    expect(run.climb).toBe(0);
  });

  it('reports the camera climb in coins', () => {
    const run = new Session();
    run.start();
    for (let index = 0; index < 3; index++) land(run);
    expect(run.climb).toBeCloseTo(3);
  });
});
