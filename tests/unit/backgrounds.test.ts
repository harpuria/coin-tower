import { expect, it } from 'vitest';
import { backgroundAt, backgroundDrifts } from '../../src/game/backgrounds';
it.each([
  [0, 'morning'],
  [5, 'morning'],
  [9, 'morning'],
  [10, 'noon'],
  [15, 'noon'],
  [19, 'noon'],
  [20, 'evening'],
  [29, 'evening'],
  [30, 'night'],
  [39, 'night'],
  [40, 'morning'],
  [49, 'morning'],
  [50, 'noon'],
])('uses ten-coin background boundaries at %s', (score, time) => {
  expect(backgroundAt(Number(score))).toBe(time);
});

it('drifts within a stage and keeps the outgoing background at its top edge', () => {
  expect(backgroundDrifts(0, 0, false)).toEqual({ base: 0, next: 0 });
  expect(backgroundDrifts(5, 5, false).base).toBeCloseTo(0.5);
  // 10번째 동전의 정착 중: 이전 배경은 끝으로, 새 배경은 시작에서 나타난다.
  expect(backgroundDrifts(10, 9.5, true).base).toBeCloseTo(0.95);
  expect(backgroundDrifts(10, 9.5, true).next).toBe(0);
  expect(backgroundDrifts(10, 10, true)).toEqual({ base: 1, next: 0 });
  // 전환이 끝나면 같은 배경이 새 구간의 시작값을 이어받는다.
  expect(backgroundDrifts(10, 10, false)).toEqual({ base: 0, next: 0 });
  expect(backgroundDrifts(17, 17, false).base).toBeCloseTo(0.7);
});
