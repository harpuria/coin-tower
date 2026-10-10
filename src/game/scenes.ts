import Phaser from 'phaser';
import type { App } from '../app';
import { assetKeys } from './assets';
import type { BackgroundTime } from './backgrounds';
import type { GameController } from './controller';
import { feedbackRules, landingVisual } from './feedback';
import { rules } from './rules';

export interface DebugControl {
  snapshot: () => ReturnType<App['session']['snapshot']>;
  background: () => {
    base: {
      key: string;
      alpha: number;
      visible: boolean;
      width: number;
      height: number;
    };
    next: {
      key: string;
      alpha: number;
      visible: boolean;
      width: number;
      height: number;
    };
  };
  freeze: (value: boolean) => void;
  advance: (milliseconds: number) => void;
  feedback: () => {
    remainingMs: number;
    coin: { x: number; y: number; width: number; height: number } | null;
    label: { width: number; height: number; visible: boolean };
    particles: { visible: boolean; alpha: number };
  };
}
declare global {
  interface Window {
    __COIN_TOWER__?: DebugControl;
  }
}

const backgroundTextures: Record<BackgroundTime, string> = {
  morning: assetKeys.background,
  noon: assetKeys.backgroundNoon,
  evening: assetKeys.backgroundEvening,
  night: assetKeys.backgroundNight,
};

/** 원본 금화와 배경으로 한 판을 그리며 게임 시간은 Session에 맡긴다. */
export class CoinTowerScene extends Phaser.Scene {
  private backgroundBase!: Phaser.GameObjects.Image;
  private backgroundNext!: Phaser.GameObjects.Image;
  private pedestal!: Phaser.GameObjects.Image;
  private activeCoin!: Phaser.GameObjects.Image;
  private titleCoin!: Phaser.GameObjects.Image;
  private logo!: Phaser.GameObjects.Image;
  private feedback!: Phaser.GameObjects.Image;
  private sparkles!: Phaser.GameObjects.Graphics;
  private stacked: Phaser.GameObjects.Image[] = [];
  private debugFrozen = false;
  constructor(
    private app: App,
    private controller: GameController,
  ) {
    super('CoinTower');
  }

  create() {
    this.backgroundBase = this.add
      .image(360, 640, assetKeys.background)
      .setDisplaySize(rules.width, rules.height)
      .setDepth(-2);
    this.backgroundNext = this.add
      .image(360, 640, assetKeys.background)
      .setDisplaySize(rules.width, rules.height)
      .setDepth(-1)
      .setVisible(false);
    this.pedestal = this.add
      .image(360, 620, assetKeys.pedestal, 'art')
      .setOrigin(0.5, 0);
    this.activeCoin = this.add
      .image(360, 0, assetKeys.coin, 'art')
      .setDisplaySize(rules.diameter, 102);
    this.titleCoin = this.add
      .image(360, 610, assetKeys.coin, 'art')
      .setDisplaySize(188, 115);
    this.logo = this.add.image(360, 190, assetKeys.logo, 'art');
    this.feedback = this.add
      .image(360, 360, assetKeys.perfect)
      .setOrigin(0.5, 1)
      .setDepth(5)
      .setVisible(false);
    this.sparkles = this.add.graphics().setDepth(4);
    if (
      import.meta.env.DEV &&
      new URLSearchParams(location.search).has('debug')
    ) {
      window.__COIN_TOWER__ = {
        snapshot: () => this.app.session.snapshot(),
        background: () => {
          const inspect = (image: Phaser.GameObjects.Image) => ({
            key: image.texture.key,
            alpha: image.alpha,
            visible: image.visible,
            width: image.displayWidth,
            height: image.displayHeight,
          });
          return {
            base: inspect(this.backgroundBase),
            next: inspect(this.backgroundNext),
          };
        },
        freeze: (value) => {
          this.debugFrozen = value;
        },
        feedback: () => {
          const coin = this.stacked.filter((sprite) => sprite.visible).at(-1);
          return {
            remainingMs: this.app.session.feedbackRemaining,
            coin: coin
              ? {
                  x: coin.x,
                  y: coin.y,
                  width: coin.displayWidth,
                  height: coin.displayHeight,
                }
              : null,
            label: {
              width: this.feedback.displayWidth,
              height: this.feedback.displayHeight,
              visible: this.feedback.visible,
            },
            particles: {
              visible: this.sparkles.visible,
              alpha: this.sparkles.alpha,
            },
          };
        },
        advance: (ms) => {
          this.controller.update(ms);
          this.renderRun();
        },
      };
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        delete window.__COIN_TOWER__;
      });
    }
    this.renderRun();
  }
  update(_time: number, delta: number) {
    if (!this.debugFrozen) this.controller.update(Math.min(delta, 50));
    this.renderRun();
  }
  private renderRun() {
    const run = this.app.session;
    const reducedMotion = this.app.settings.data.reducedMotion;
    const visual = landingVisual(
      run.feedback,
      run.feedbackRemaining,
      reducedMotion,
    );
    const background = run.background;
    const progress = background.progress;
    // 아래 배경은 불투명하게 두고 새 배경으로 덮어 검은 중간 화면을 막는다.
    this.backgroundBase
      .setTexture(backgroundTextures[background.from])
      .setDisplaySize(rules.width, rules.height);
    this.backgroundNext
      .setTexture(backgroundTextures[background.to])
      .setDisplaySize(rules.width, rules.height)
      .setAlpha(progress * progress * (3 - 2 * progress))
      .setVisible(background.from !== background.to);
    const title = run.mode === 'menu';
    this.logo
      .setPosition(title ? 360 : 142, title ? 190 : 92)
      .setDisplaySize(title ? 510 : 235, title ? 354 : 163);
    this.titleCoin.setVisible(title);
    this.pedestal
      .setPosition(360, title ? 620 : rules.platformY - 102 + run.cameraOffset)
      .setDisplaySize(title ? 415 : 560, title ? 405 : 546);
    this.pedestal.setVisible(title || this.pedestal.y < rules.height);
    // 화면 밖의 탑까지 sprite를 늘리지 않고 보이는 동전 수만큼 재사용한다.
    const visible = title
      ? []
      : run.coins.filter((coin) => {
          const y = coin.y + run.cameraOffset;
          return y > -102 && y < rules.height + 102;
        });
    visible.forEach((coin, index) => {
      const sprite =
        this.stacked[index] ??
        this.add
          .image(0, 0, assetKeys.coin, 'art')
          .setDisplaySize(rules.diameter, 102)
          .setDepth(1);
      this.stacked[index] = sprite;
      const top = coin === run.coins.at(-1);
      const width = rules.diameter * (top ? visual.width : 1);
      const height = 102 * (top ? visual.height : 1);
      // 접점의 바닥을 고정한 채 새 동전만 눌렀다 복원한다. 모델 좌표는 그대로다.
      sprite
        .setVisible(true)
        .setDisplaySize(width, height)
        .setPosition(coin.x, coin.y + run.cameraOffset + (102 - height) / 2);
    });
    for (let index = visible.length; index < this.stacked.length; index++)
      this.stacked[index]!.setVisible(false);
    this.activeCoin
      .setDepth(2)
      .setPosition(run.activeX, run.activeY + run.cameraOffset)
      .setVisible(
        !title && (run.phase !== 'settling' || run.mode === 'result'),
      );
    const feedbackVisible =
      run.mode === 'playing' && !run.frozen && run.feedbackRemaining > 0;
    this.feedback
      .setVisible(feedbackVisible)
      .setAlpha(Math.min(1, run.feedbackRemaining / 280));
    this.sparkles
      .clear()
      .setVisible(feedbackVisible && visual.particleAlpha > 0)
      .setAlpha(visual.particleAlpha);
    if (feedbackVisible && run.feedback) {
      const perfect = run.feedback === 'perfect';
      this.feedback
        .setTexture(
          perfect ? assetKeys.perfect : assetKeys.nice,
          perfect ? undefined : 'art',
        )
        .setPosition(360, perfect ? 360 : 347.5)
        .setDisplaySize(
          (perfect ? 320 : 245) * visual.pop,
          (perfect ? 160 : 135) * visual.pop,
        );
      const coin = run.coins.at(-1);
      if (coin && visual.particleAlpha > 0)
        this.drawImpact(
          coin.x,
          coin.y + run.cameraOffset + 43,
          perfect,
          visual.particleT,
          reducedMotion,
        );
    }
  }

  private drawImpact(
    x: number,
    y: number,
    perfect: boolean,
    t: number,
    reducedMotion: boolean,
  ) {
    const graphics = this.sparkles;
    const count = feedbackRules[perfect ? 'perfect' : 'nice'].particles;
    // 동전 중앙을 덮지 않고 접점 좌우에 짧은 빛과 입자를 둔다.
    for (const side of [-1, 1]) {
      const edgeX = x + side * rules.diameter * 0.51;
      graphics.lineStyle(perfect ? 3 : 2, perfect ? 0xfff4c3 : 0xffd35c, 1);
      graphics.lineBetween(edgeX - 10, y, edgeX + 10, y);
      if (perfect) graphics.lineBetween(edgeX, y - 6, edgeX, y + 6);
    }
    if (reducedMotion) return;
    graphics.lineStyle(perfect ? 2.5 : 1.5, 0xffd35c, 0.55);
    graphics.strokeEllipse(x, y, 130 + t * 85, 15 + t * 18);
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const lane = Math.floor(i / 2);
      const px = x + side * (rules.diameter * 0.55 + t * (26 + lane * 8));
      const py = y - 8 - t * (20 + lane * 12) + t * t * 16;
      const size = (perfect ? 5.5 : 3.5) * (1 - t * 0.5);
      graphics.fillStyle(i % 3 === 0 ? 0xfff6d3 : 0xffd35c, 1);
      if (perfect && i % 3 === 0) {
        graphics.fillTriangle(
          px,
          py - size * 1.6,
          px - size,
          py,
          px + size,
          py,
        );
        graphics.fillTriangle(
          px,
          py + size * 1.6,
          px - size,
          py,
          px + size,
          py,
        );
      } else graphics.fillCircle(px, py, size);
    }
  }
}
