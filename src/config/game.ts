export const gameConfig = {
  title: 'Coin Tower',
  version: '0.1.0',
  storagePrefix: 'coin-tower-web-demo', // 새 게임마다 고유한 값으로 변경
  width: 720,
  height: 1280,
  background: '#101827',
  /** 픽셀아트 게임은 true: 텍스처 보간을 끄고 좌표를 정수로 맞춘다. */
  pixelArt: false,
  /** 전체화면에서 시도할 방향 고정. 지원하지 않는 브라우저는 안내만 표시한다. */
  orientation: 'portrait' as 'landscape' | 'portrait',
  startScene: 'Menu',
  /** 일시정지 이유가 있는 동안 멈출 장면. 메뉴 연출처럼 계속 움직여도 되는 장면은 넣지 않는다. */
  pausableScenes: ['Game'],
  autosaveMs: 15_000,
  transitionMs: 180,
  services: { mock: false, ads: false, billing: false, analytics: false },
} as const;
