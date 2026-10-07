import type Phaser from 'phaser';

/** 전체화면 전환. 진입 시 방향 고정을 시도하며 실패해도 무시한다(iOS 등 미지원). */
export function toggleFullscreen(
  game: Phaser.Game,
  orientation: 'landscape' | 'portrait',
) {
  const scale = game.scale;
  if (scale.isFullscreen) {
    scale.stopFullscreen();
    return;
  }
  scale.startFullscreen();
  const lock = (
    screen.orientation as ScreenOrientation & {
      lock?: (value: string) => Promise<void>;
    }
  )?.lock;
  lock?.call(screen.orientation, orientation).catch(() => {});
}

export function fullscreenAvailable(game: Phaser.Game) {
  return game.device.fullscreen.available;
}
