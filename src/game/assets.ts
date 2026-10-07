import type Phaser from 'phaser';

/** asset 키를 한곳에 모아 장면·UI에서 문자열을 반복하지 않는다. */
export const assetKeys = {
  player: 'player',
  star: 'star',
  music: 'music',
  collect: 'collect',
} as const;

/** Queue game-specific assets here. Paths stay relative to Vite's deployment base. */
export function queueAssets(load: Phaser.Loader.LoaderPlugin) {
  load.setPath(`${import.meta.env.BASE_URL}assets/demo/`);
  load.svg(assetKeys.player, 'player.svg', { width: 52, height: 52 });
  load.svg(assetKeys.star, 'star.svg', { width: 36, height: 36 });
  load.audio(assetKeys.collect, 'collect.wav');
  load.audio(assetKeys.music, 'music.wav');
}
