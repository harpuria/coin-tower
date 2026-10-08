import Phaser from 'phaser';
import type { App } from '../app';
import { assetKeys } from './assets';
import type { BackgroundTime } from './backgrounds';
import type { GameController } from './controller';
import { rules } from './rules';

export interface DebugControl {
  snapshot: () => ReturnType<App['session']['snapshot']>;
  freeze: (value: boolean) => void;
  advance: (milliseconds: number) => void;
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
      .image(360, 280, assetKeys.perfect)
      .setDepth(5)
      .setVisible(false);
    this.sparkles = this.add.graphics().setDepth(4);
    if (
      import.meta.env.DEV &&
      new URLSearchParams(location.search).has('debug')
    ) {
      window.__COIN_TOWER__ = {
        snapshot: () => this.app.session.snapshot(),
        freeze: (value) => {
          this.debugFrozen = value;
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
      sprite.setVisible(true).setPosition(coin.x, coin.y + run.cameraOffset);
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
    this.sparkles.clear();
    if (feedbackVisible && run.feedback) {
      const perfect = run.feedback === 'perfect';
      this.feedback
        .setTexture(
          perfect ? assetKeys.perfect : assetKeys.nice,
          perfect ? undefined : 'art',
        )
        .setDisplaySize(perfect ? 320 : 245, perfect ? 160 : 135);
      if (perfect && !this.app.settings.data.reducedMotion) {
        const t = 1 - run.feedbackRemaining / rules.feedbackMs;
        this.sparkles.fillStyle(0xffda50, Math.max(0, 1 - t));
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          this.sparkles.fillCircle(
            run.targetX + Math.cos(angle) * (45 + t * 85),
            840 + Math.sin(angle) * (20 + t * 55),
            3 + (i % 3),
          );
        }
      }
    }
  }
}
