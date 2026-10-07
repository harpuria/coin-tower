import Phaser from 'phaser';
import type { App } from '../app';

export class BootScene extends Phaser.Scene {
  constructor(private app: App) {
    super('Boot');
  }
  create() {
    this.app.attach(this.game);
    this.scene.start('Preload');
  }
}
