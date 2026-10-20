import { rules } from './rules';

export const feedbackRules = {
  nice: {
    reboundMs: 140,
    squash: 0.06,
    particleMs: 160,
    particles: 4,
    particleSize: 3.2,
    particleSpread: 18,
    particleRise: 18,
    color: 0xeab24a,
    highlight: 0xfbe9ac,
    soundRate: 0.88,
    soundGain: 0.9,
  },
  perfect: {
    reboundMs: 180,
    squash: 0.08,
    particleMs: 250,
    particles: 6,
    particleSize: 11,
    soundRate: 1.24,
    soundGain: 1,
  },
  popMs: 180,
  popAmount: 0.08,
  reducedFlashMs: 120,
} as const;

const smooth = (t: number) => t * t * (3 - 2 * t);

export const failureRules = {
  durationMs: 400,
  soundGain: 0.85,
  travel: 160,
  fall: 240,
  angle: 65,
} as const;

/** 착지 판정을 바꾸지 않고 실패 동전의 표시만 기울여 떨어뜨린다. */
export function failureVisual(remainingMs: number, direction: number) {
  const t = Math.min(1, Math.max(0, 1 - remainingMs / failureRules.durationMs));
  return {
    x: direction * failureRules.travel * t,
    y: failureRules.fall * t * t,
    angle: direction * failureRules.angle * t,
    alpha: Math.min(1, (1 - t) * 4),
  };
}

/** 별도 시계 없이 Session의 착지 후 경과 시간으로 표시만 계산한다. */
export function landingVisual(
  kind: 'nice' | 'perfect' | null,
  remainingMs: number,
  reducedMotion: boolean,
) {
  const config = feedbackRules[kind ?? 'nice'];
  const elapsed = Math.max(0, rules.feedbackMs - remainingMs);
  const active = kind !== null && remainingMs > 0;
  const t = Math.min(1, elapsed / config.reboundMs);
  let stretch = 0;
  if (active && !reducedMotion && t < 1) {
    if (t < 0.3) stretch = -config.squash * Math.sin((t / 0.3) * Math.PI * 0.5);
    else if (t < 0.65)
      stretch = config.squash * (-1 + 1.4 * smooth((t - 0.3) / 0.35));
    else stretch = config.squash * 0.4 * (1 - smooth((t - 0.65) / 0.35));
  }
  const popT = Math.min(1, elapsed / feedbackRules.popMs);
  const pop =
    active && kind === 'perfect' && !reducedMotion && popT < 1
      ? 1 + feedbackRules.popAmount * Math.sin(popT * Math.PI)
      : 1;
  const particleT = Math.min(
    1,
    elapsed /
      (reducedMotion ? feedbackRules.reducedFlashMs : config.particleMs),
  );
  return {
    width: 1 - stretch * 0.5,
    height: 1 + stretch,
    pop,
    particleT,
    particleAlpha: active ? 1 - particleT : 0,
  };
}

/** 플레이 중 높이 이정표. 축하 표시는 다음 낙하를 지연시키지 않는다. */
export const milestoneRules = {
  coins: [10, 25, 50, 100],
  /** 마지막 지정 높이 뒤에는 이 간격마다 축하한다. */
  every: 50,
  durationMs: 1600,
  popMs: 260,
  soundRate: 1.5,
  soundGain: 0.8,
} as const;

export function isMilestone(score: number): boolean {
  const last = milestoneRules.coins.at(-1)!;
  return (
    (milestoneRules.coins as readonly number[]).includes(score) ||
    (score > last && (score - last) % milestoneRules.every === 0)
  );
}

/** Session의 잔여 시간만으로 이정표 배너의 불투명도·크기를 계산한다. */
export function milestoneVisual(remainingMs: number, reducedMotion: boolean) {
  const elapsed = milestoneRules.durationMs - remainingMs;
  const active = remainingMs > 0;
  const fadeIn = Math.min(1, elapsed / 120);
  const fadeOut = Math.min(1, remainingMs / 400);
  const t = Math.min(1, elapsed / milestoneRules.popMs);
  const pop =
    active && !reducedMotion && t < 1
      ? 0.7 + 0.3 * smooth(t) + 0.12 * Math.sin(t * Math.PI)
      : 1;
  return { opacity: active ? Math.min(fadeIn, fadeOut) : 0, scale: pop };
}
