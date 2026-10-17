/** 테스트용 구간과 전환 시간. 의도와 조정 기준은 design/backgrounds.md를 따른다. */
export const backgroundRules = {
  coinsPerStage: 10,
  fadeMs: 1200,
} as const;

export const backgroundTimes = ['morning', 'noon', 'evening', 'night'] as const;
export type BackgroundTime = (typeof backgroundTimes)[number];

export const backgroundFiles: Record<BackgroundTime, string> = {
  morning: 'sky_ruins.png',
  noon: 'backgrounds/sky_ruins_noon.png',
  evening: 'backgrounds/sky_ruins_evening.png',
  night: 'backgrounds/sky_ruins_night.png',
};

/** 플레이 화면과 바깥 배경은 같은 모델 진행률로 부드럽게 섞는다. */
export function backgroundAlpha(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

export function backgroundAt(score: number): BackgroundTime {
  return backgroundTimes[
    Math.floor(score / backgroundRules.coinsPerStage) % backgroundTimes.length
  ]!;
}
