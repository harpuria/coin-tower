import Phaser from 'phaser';
import { gameConfig } from '../config/game';
import { installAssetFrames, queueAssets } from '../game/assets';
import type { App } from '../app';

export class PreloadScene extends Phaser.Scene {
  private failed = false;
  constructor(private app: App) {
    super('Preload');
  }
  preload() {
    const { width, height } = this.scale;
    const label = this.add
      .text(width / 2, height / 2, '준비 중… 0%', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#e2e8f0',
        align: 'center',
      })
      .setOrigin(0.5);
    this.load.on('progress', (value: number) => {
      if (!this.failed) label.setText(`준비 중… ${Math.round(value * 100)}%`);
    });
    this.failed = false;
    this.load.on('loaderror', () => {
      this.failed = true;
      this.app.loadingError =
        '파일을 불러오지 못했습니다. 새로고침해 다시 시도해 주세요.';
      this.app.onState();
      label.setText(
        '파일을 불러오지 못했습니다.\n새로고침해 다시 시도해 주세요.',
      );
    });
    queueAssets(this.load);
  }
  create() {
    if (this.failed) return;
    installAssetFrames(this.textures);
    this.app.ready = true;
    this.app.onState();
    this.scene.start(gameConfig.startScene);
  }
}
