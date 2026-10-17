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
  speedRampCoins: 20,
  lateSpeedGain: 100,
  lateSpeedSpan: 20,
  zoomStartCoins: 20,
  zoomEndCoins: 60,
  minZoom: 0.9,
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
  const early =
    rules.baseSpeed +
    rules.speedPerCoin * Math.min(score, rules.speedRampCoins);
  const late = Math.max(0, score - rules.speedRampCoins);
  return (
    early + rules.lateSpeedGain * Math.log2(1 + late / rules.lateSpeedSpan)
  );
}

/** 표시만 축소하며 논리 좌표의 판정 폭은 바꾸지 않는다. */
export function cameraZoom(score: number) {
  const progress = Math.min(
    1,
    Math.max(
      0,
      (score - rules.zoomStartCoins) /
        (rules.zoomEndCoins - rules.zoomStartCoins),
    ),
  );
  return 1 - (1 - rules.minZoom) * progress;
}
