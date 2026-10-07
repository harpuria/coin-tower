import Phaser from 'phaser';
import type { App } from '../app';
import { MoveInput } from '../core/input';
import { transition } from '../core/navigation';
import { assetKeys } from './assets';
import { roundMs } from './session';

function background(scene: Phaser.Scene) {
  const { width, height } = scene.scale;
  const grid = scene.add.graphics().lineStyle(1, 0x263448, 0.65);
  for (let x = 0; x < width; x += 48) grid.lineBetween(x, 0, x, height);
  for (let y = 0; y < height; y += 48) grid.lineBetween(0, y, width, y);
  grid
    .lineStyle(2, 0x344458)
    .strokeRoundedRect(26, 26, width - 52, height - 52, 20);
}

export class MenuScene extends Phaser.Scene {
  constructor(private app: App) {
    super('Menu');
  }
  create() {
    const cx = this.scale.width / 2;
    const h = this.scale.height;
    this.app.session.mode = 'menu';
    this.app.onState();
    background(this);
    this.add
      .text(cx, h * 0.26, 'COIN TOWER', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#a3e635',
        letterSpacing: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, h * 0.36, '웹 플레이 준비 완료', {
        fontFamily: 'sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, h * 0.44, '별 모으기 예제로 화면과 입력을 확인하세요.', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);
    const player = this.add.image(cx, h * 0.62, assetKeys.player).setScale(1.7);
    [cx - 120, cx + 120].forEach((x) =>
      this.add.image(x, h * 0.62, assetKeys.star),
    );
    if (!this.app.settings.data.reducedMotion)
      this.tweens.add({
        targets: player,
        y: h * 0.62 - 13,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    this.cameras.main.fadeIn(this.app.transitionMs);
  }
  startGame() {
    transition(this, 'Game', this.app.transitionMs);
  }
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private star!: Phaser.Physics.Arcade.Image;
  private controls!: MoveInput;
  private label!: Phaser.GameObjects.Text;
  private remaining = 0;
  private ended = false;

  constructor(private app: App) {
    super('Game');
  }
  create() {
    const { width, height } = this.scale;
    this.ended = false;
    this.remaining = roundMs();
    this.app.session.score = 0;
    this.app.session.mode = 'playing';
    this.app.onState();
    background(this);
    this.physics.world.setBounds(46, 82, width - 92, height - 134);
    this.player = this.physics.add
      .image(width / 2, height / 2, assetKeys.player)
      .setCircle(23, 3, 3)
      .setCollideWorldBounds(true);
    this.star = this.physics.add
      .image(width / 2 + 110, height / 2, assetKeys.star)
      .setCircle(17, 1, 1)
      .setImmovable(true);
    this.physics.add.overlap(this.player, this.star, () => this.collect());
    this.label = this.add.text(52, 44, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#e2e8f0',
    });
    this.controls = new MoveInput(this);
    this.app.audio?.playMusic(assetKeys.music);
    this.cameras.main.fadeIn(this.app.transitionMs);
    if (this.app.pause.paused) this.scene.pause();
  }
  private collect() {
    if (this.ended) return;
    const bounds = this.physics.world.bounds;
    this.app.session.score++;
    this.star.setPosition(
      Phaser.Math.Between(bounds.left + 44, bounds.right - 44),
      Phaser.Math.Between(bounds.top + 38, bounds.bottom - 43),
    );
    this.app.audio?.sfx(assetKeys.collect);
    this.app.onState();
  }
  update(_time: number, delta: number) {
    if (this.ended) return;
    const direction = this.controls.move(this.player).scale(290);
    this.player.setVelocity(direction.x, direction.y);
    this.remaining = Math.max(0, this.remaining - delta);
    this.label.setText(
      `STARS  ${String(this.app.session.score).padStart(2, '0')}    TIME  ${Math.ceil(this.remaining / 1000)}s`,
    );
    if (this.remaining === 0) this.finish();
  }
  finish() {
    if (this.ended) return;
    const { width, height } = this.scale;
    const score = this.app.session.score;
    this.ended = true;
    this.player.setVelocity(0, 0);
    this.app.save.update((data) => ({
      best: Math.max(data.best, score),
      rounds: data.rounds + 1,
    }));
    this.app.flush();
    this.app.platform.track('round_completed');
    this.app.session.mode = 'result';
    this.app.onState();
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x101827, 0.92)
      .setDepth(10);
    this.add
      .text(width / 2, height * 0.45, `${score}개의 별을 모았어요`, {
        fontFamily: 'sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#a3e635',
      })
      .setOrigin(0.5)
      .setDepth(11);
    const message =
      this.app.save.status === 'ready'
        ? '기록을 저장했습니다. 다시 도전해 보세요!'
        : '기록을 저장하지 못했습니다. 저장 상태를 확인해 주세요.';
    this.add
      .text(width / 2, height * 0.52, message, {
        fontFamily: 'sans-serif',
        fontSize: '21px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5)
      .setDepth(11);
  }
  goHome() {
    transition(this, 'Menu', this.app.transitionMs);
  }
}
