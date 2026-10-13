import type Phaser from 'phaser';
import { gameConfig } from '../config/game';
import { artFile, standaloneArt } from './art';
import { skins } from './skins';

export const assetKeys = {
  coin: 'coin',
  pedestal: 'pedestal',
  background: 'background',
  backgroundNoon: 'backgroundNoon',
  backgroundEvening: 'backgroundEvening',
  backgroundNight: 'backgroundNight',
  panel: 'panel',
  logo: 'logo',
  tapToPlay: 'tapToPlay',
  perfect: 'perfect',
  nice: 'nice',
  gameOver: 'gameOver',
  paused: 'paused',
  bestCoinsIcon: 'bestCoinsIcon',
  bestComboIcon: 'bestComboIcon',
  starShardsIcon: 'starShardsIcon',
  shopIcon: 'shopIcon',
  soundOnIcon: 'soundOnIcon',
  soundOffIcon: 'soundOffIcon',
  fullscreenEnterIcon: 'fullscreenEnterIcon',
  fullscreenExitIcon: 'fullscreenExitIcon',
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
  tapToPlay: 'tap_to_play.png',
  perfect: 'perfect.png',
  nice: 'nice.png',
  gameOver: 'game_over.png',
  paused: 'paused.png',
  bestCoinsIcon: 'icons/best-coins.png',
  bestComboIcon: 'icons/best-combo.png',
  starShardsIcon: 'icons/star-shards.png',
  shopIcon: 'icons/shop.png',
  soundOnIcon: 'icons/sound-on.png',
  soundOffIcon: 'icons/sound-off.png',
  fullscreenEnterIcon: 'icons/fullscreen-enter.png',
  fullscreenExitIcon: 'icons/fullscreen-exit.png',
} as const;

/** 원본과 동일한 좌표로 투명 여백을 텍스처 frame에서 제외한다. */
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
  for (const [key, file] of Object.entries(images)) {
    if (gameConfig.crazygames && standaloneArt.has(file)) continue;
    load.image(key, artFile(file));
  }
  for (const skin of skins)
    if (skin.id !== 'gold') load.image(skin.texture, artFile(skin.file));
  for (const glyph of 'x0123456789')
    load.image(`combo-${glyph}`, artFile(`combo/${glyph}.png`));
  load.audio(assetKeys.stack, 'stack.wav');
}
export function installAssetFrames(textures: Phaser.Textures.TextureManager) {
  const skinRegions = Object.fromEntries(
    skins.map((skin) => [skin.texture, regions.coin!]),
  );
  for (const [key, [x, y, width, height]] of Object.entries({
    ...regions,
    ...skinRegions,
  })) {
    const texture = textures.get(key);
    if (!texture.has('art')) texture.add('art', 0, x, y, width, height);
  }
}
