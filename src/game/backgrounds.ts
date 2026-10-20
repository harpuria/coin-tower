/** 테스트용 구간과 전환 시간. 의도와 조정 기준은 design/backgrounds.md를 따른다. */
export const backgroundRules = {
  coinsPerStage: 10,
  fadeMs: 1200,
  /** 위아래로 흐를 여유를 위해 논리 화면보다 크게 그리는 배율. */
  driftScale: 1.18,
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

/**
 * 한 시간대 구간을 오르는 동안 배경을 아래로 흘린다. 0은 하단 정렬, 1은 상단 정렬이다.
 * 전환 중인 이전 배경은 앞 구간의 끝에 머물러 새 배경과 이어진다.
 */
export function backgroundDrift(climb: number, stage: number): number {
  return Math.min(
    1,
    Math.max(0, climb / backgroundRules.coinsPerStage - stage),
  );
}

export function backgroundDrifts(
  score: number,
  climb: number,
  changing: boolean,
) {
  const stage = Math.floor(score / backgroundRules.coinsPerStage);
  return {
    base: backgroundDrift(climb, changing ? stage - 1 : stage),
    next: backgroundDrift(climb, stage),
  };
}
