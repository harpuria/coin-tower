/** 테스트용 구간과 전환 시간. 의도와 조정 기준은 design/backgrounds.md를 따른다. */
export const backgroundRules = {
  coinsPerStage: 5,
  fadeMs: 1200,
} as const;

export const backgroundTimes = ['morning', 'noon', 'evening', 'night'] as const;
export type BackgroundTime = (typeof backgroundTimes)[number];

export function backgroundAt(score: number): BackgroundTime {
  return backgroundTimes[
    Math.floor(score / backgroundRules.coinsPerStage) % backgroundTimes.length
  ]!;
}
