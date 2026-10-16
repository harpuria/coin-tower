/** 결과에서 추천할 다음 도전 단계의 조정값. 플레이 종료 조건과는 별개다. */
export const heightGoalRules = { first: 5, interval: 10 } as const;

export function nextHeightGoal(score: number) {
  return score < heightGoalRules.first
    ? heightGoalRules.first
    : (Math.floor(score / heightGoalRules.interval) + 1) *
        heightGoalRules.interval;
}
