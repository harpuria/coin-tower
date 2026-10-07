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
      .text(width / 2, height / 2, 'Loading… 0%', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#e2e8f0',
        align: 'center',
      })
      .setOrigin(0.5);
    this.load.on('progress', (value: number) => {
      if (!this.failed) label.setText(`Loading… ${Math.round(value * 100)}%`);
    });
    this.failed = false;
    this.load.on('loaderror', () => {
      this.failed = true;
      this.app.loadingError =
        'Unable to load game files. Please reload to try again.';
      this.app.onState();
      label.setText('Unable to load game files.\nPlease reload to try again.');
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
