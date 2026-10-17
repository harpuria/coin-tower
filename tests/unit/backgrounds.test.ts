import { expect, it } from 'vitest';
import { backgroundAt } from '../../src/game/backgrounds';
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
