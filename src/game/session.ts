const defaultRoundMs = 30_000;

/**
 * 한 판 길이. `?round=초`로 짧게 줄일 수 있다(E2E와 수동 확인용, 기본값보다 길게는 못 늘린다).
 * 실제 게임에서 이런 조정값이 보상·랭킹에 영향을 준다면 `import.meta.env.DEV`일 때만 읽는다.
 */
export function roundMs(search = location.search): number {
  const seconds = Number(new URLSearchParams(search).get('round'));
  return seconds > 0
    ? Math.min(seconds * 1000, defaultRoundMs)
    : defaultRoundMs;
}

export type Mode = 'menu' | 'playing' | 'result';

/** 예제 게임의 진행 중 상태. 저장하지 않는 값만 둔다(저장 값은 save.ts). */
export class Session {
  mode: Mode = 'menu';
  score = 0;
}
