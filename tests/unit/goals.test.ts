import { expect, it } from 'vitest';
import { nextHeightGoal } from '../../src/game/goals';
import { nextSkinGoal } from '../../src/game/skins';

it.each([
  [0, 5],
  [3, 5],
  [4, 5],
  [5, 10],
  [9, 10],
  [10, 20],
  [12, 20],
  [20, 30],
  [27, 30],
  [100, 110],
])('recommends the next stage after %i coins: %i', (score, target) => {
  expect(nextHeightGoal(score!)).toBe(target);
});
it('recommends the cheapest unowned skin even after a more expensive purchase', () => {
  expect(nextSkinGoal(['gold'])?.id).toBe('silver');
  expect(nextSkinGoal(['gold', 'ruby'])?.id).toBe('silver');
  expect(nextSkinGoal(['gold', 'silver'])?.id).toBe('ruby');
  expect(nextSkinGoal(['gold', 'silver', 'ruby'])?.id).toBe('emerald');
  expect(nextSkinGoal(['gold', 'silver', 'ruby', 'emerald'])).toBeNull();
});
