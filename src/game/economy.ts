/** 성공한 동전당 별조각. 가격·스킨·광고와 별개로 조정한다. */
export const economyRules = { shardsPerCoin: 1 } as const;

export function shardReward(score: number, balance: number) {
  // 저장 가능한 정수 범위를 넘겨 기존 진행 데이터가 손상되지 않게 한다.
  const earned = Math.min(
    score * economyRules.shardsPerCoin,
    Number.MAX_SAFE_INTEGER - balance,
  );
  return { earned, total: balance + earned };
}
