import type Phaser from 'phaser';

export const assetKeys = {
  coin: 'coin',
  pedestal: 'pedestal',
  background: 'background',
  backgroundNoon: 'backgroundNoon',
  backgroundEvening: 'backgroundEvening',
  backgroundNight: 'backgroundNight',
  panel: 'panel',
  logo: 'logo',
  perfect: 'perfect',
  nice: 'nice',
  gameOver: 'gameOver',
  paused: 'paused',
  stack: 'stack',
} as const;

const images = {
  coin: 'coin.png',
  pedestal: 'pedestal.png',
  background: 'sky_ruins.png',
  backgroundNoon: 'backgrounds/sky_ruins_noon.png',
  backgroundEvening: 'backgrounds/sky_ruins_evening.png',
  backgroundNight: 'backgrounds/sky_ruins_night.png',
  panel: 'hud_panel.png',
  logo: 'logo.png',
  perfect: 'perfect.png',
  nice: 'nice.png',
  gameOver: 'game_over.png',
  paused: 'paused.png',
} as const;

/** 원본 PNG를 수정하지 않고 모바일과 같은 투명 여백을 텍스처 frame으로 제외한다. */
const regions: Record<string, readonly [number, number, number, number]> = {
  coin: [300, 180, 1000, 630],
  pedestal: [0, 95, 1206, 1175],
  panel: [140, 150, 1580, 530],
  logo: [90, 45, 1370, 950],
  nice: [250, 25, 1510, 835],
  gameOver: [25, 10, 2130, 580],
  paused: [110, 80, 1940, 530],
};

export function queueAssets(load: Phaser.Loader.LoaderPlugin) {
  load.setPath(`${import.meta.env.BASE_URL}assets/coin-tower/`);
  for (const [key, file] of Object.entries(images)) load.image(key, file);
  for (const glyph of 'x0123456789')
    load.image(`combo-${glyph}`, `combo/${glyph}.png`);
  load.audio(assetKeys.stack, 'stack.wav');
}
export function installAssetFrames(textures: Phaser.Textures.TextureManager) {
  for (const [key, [x, y, width, height]] of Object.entries(regions)) {
    const texture = textures.get(key);
    if (!texture.has('art')) texture.add('art', 0, x, y, width, height);
  }
}
