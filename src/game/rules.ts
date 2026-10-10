/** 원본 시작값과 합의한 웹 조정값. 의도와 조정 기준은 GAME_DESIGN.md를 따른다. */
export const rules = {
  width: 720,
  height: 1280,
  diameter: 166,
  coinHeight: 56,
  platformY: 924,
  platformRadius: 255,
  laneHalfWidth: 232,
  successFraction: 0.45,
  perfectFraction: 0.1,
  baseSpeed: 350,
  speedPerCoin: 15,
  maxSpeed: 650,
  fallSpeed: 1550,
  spawnGap: 410,
  settleMs: 280,
  targetFraction: 0.7,
  feedbackMs: 700,
  resumeMs: 3000,
} as const;

export function landingKind(x: number, targetX: number, first: boolean) {
  const distance = Math.abs(x - targetX);
  const allowed = first
    ? rules.platformRadius
    : rules.diameter * rules.successFraction;
  if (distance > allowed + 1e-7) return 'miss';
  if (!first && distance <= rules.diameter * rules.perfectFraction + 1e-7)
    return 'perfect';
  return 'nice';
}

export function moveSpeed(score: number) {
  return Math.min(rules.maxSpeed, rules.baseSpeed + score * rules.speedPerCoin);
}
