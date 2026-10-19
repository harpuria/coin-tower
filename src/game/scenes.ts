import Phaser from 'phaser';
import type { App } from '../app';
import { assetKeys, resolveBackgroundTextures } from './assets';
import { backgroundAlpha } from './backgrounds';
import type { GameController } from './controller';
import { feedbackRules, landingVisual, failureVisual } from './feedback';
import { rules } from './rules';
import { skinById } from './skins';

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
  view: () => {
    active: {
      x: number;
      y: number;
      width: number;
      height: number;
      angle: number;
      visible: boolean;
    };
    top: { x: number; y: number; width: number; height: number } | null;
    visibleCoins: number;
  };
  freeze: (value: boolean) => void;
  advance: (milliseconds: number) => void;
  feedback: () => {
    remainingMs: number;
    coin: {
      x: number;
      y: number;
      width: number;
      height: number;
      texture: string;
    } | null;
    label: { width: number; height: number; visible: boolean };
    particles: {
      visible: boolean;
      alpha: number;
      x: number;
      y: number;
      scale: number;
      commands: number[];
    };
  };
}
declare global {
  interface Window {
    __COIN_TOWER__?: DebugControl;
  }
}

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
  private hint!: Phaser.GameObjects.Graphics;
  private stacked: Phaser.GameObjects.Image[] = [];
  private starPoints = Array.from(
    { length: 8 },
    () => new Phaser.Math.Vector2(),
  );
  private debugFrozen = false;
  constructor(
    private app: App,
    private controller: GameController,
  ) {
    super('CoinTower');
  }

  create() {
    this.controller.assets.attach(this.load, this.textures);
    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.controller.assets.detach,
    );
    this.events.once(
      Phaser.Scenes.Events.DESTROY,
      this.controller.assets.detach,
    );
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
    this.hint = this.add.graphics().setDepth(3);
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
        view: () => {
          const top = this.stacked.filter((coin) => coin.visible).at(-1);
          const inspect = (coin: Phaser.GameObjects.Image) => ({
            x: coin.x,
            y: coin.y,
            width: coin.displayWidth,
            height: coin.displayHeight,
          });
          return {
            active: {
              ...inspect(this.activeCoin),
              angle: this.activeCoin.angle,
              visible: this.activeCoin.visible,
            },
            top: top ? inspect(top) : null,
            visibleCoins: this.stacked.filter((coin) => coin.visible).length,
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
                  texture: coin.texture.key,
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
              x: this.sparkles.x,
              y: this.sparkles.y,
              scale: this.sparkles.scaleX,
              commands: [...this.sparkles.commandBuffer] as number[],
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
    const coinTexture = skinById(
      run.mode === 'menu'
        ? this.app.save.data.equippedSkin
        : this.controller.runSkin,
    ).texture;
    this.titleCoin.setTexture(coinTexture, 'art').setDisplaySize(188, 115);
    this.activeCoin
      .setTexture(coinTexture, 'art')
      .setDisplaySize(rules.diameter, 102);
    const reducedMotion = this.app.settings.data.reducedMotion;
    const visual = landingVisual(
      run.feedback,
      run.feedbackRemaining,
      reducedMotion,
    );
    const background = run.background;
    const progress = background.progress;
    const backdrop = resolveBackgroundTextures(background, (key) =>
      this.textures.exists(key),
    );
    // 아래 배경은 불투명하게 두고 새 배경으로 덮어 검은 중간 화면을 막는다.
    this.backgroundBase
      .setTexture(backdrop.base)
      .setDisplaySize(rules.width, rules.height);
    this.backgroundNext
      .setTexture(backdrop.next)
      .setDisplaySize(rules.width, rules.height)
      .setAlpha(backgroundAlpha(progress))
      .setVisible(backdrop.changing);
    const title = run.mode === 'menu';
    const zoom = run.zoom;
    const centerX = rules.width / 2;
    const anchorY = rules.height * rules.targetFraction;
    const projectX = (x: number) => centerX + (x - centerX) * zoom;
    const projectY = (y: number) =>
      anchorY + (y + run.cameraOffset - anchorY) * zoom;
    // 배경·로고·성공 문구는 고정하고 플레이 그림만 같은 변환으로 투영한다.
    for (const graphics of [this.sparkles, this.hint])
      graphics
        .setPosition(centerX * (1 - zoom), anchorY * (1 - zoom))
        .setScale(zoom);
    this.logo
      .setPosition(title ? 360 : 116, title ? 150 : 78)
      .setDisplaySize(title ? 420 : 180, title ? 292 : 125);
    this.titleCoin.setVisible(title);
    this.pedestal
      .setPosition(360, title ? 620 : projectY(rules.platformY - 102))
      .setDisplaySize(title ? 415 : 560 * zoom, title ? 405 : 546 * zoom);
    this.pedestal.setVisible(title || this.pedestal.y < rules.height);
    // 화면 밖의 탑까지 sprite를 늘리지 않고 보이는 동전 수만큼 재사용한다.
    const visible = title
      ? []
      : run.coins.filter((coin) => {
          const y = projectY(coin.y);
          return y > -102 && y < rules.height + 102;
        });
    visible.forEach((coin, index) => {
      const sprite =
        this.stacked[index] ??
        this.add
          .image(0, 0, coinTexture, 'art')
          .setDisplaySize(rules.diameter, 102)
          .setDepth(1);
      this.stacked[index] = sprite;
      const top = coin === run.coins.at(-1);
      const width = rules.diameter * (top ? visual.width : 1);
      const height = 102 * (top ? visual.height : 1);
      // 접점의 바닥을 고정한 채 새 동전만 눌렀다 복원한다. 모델 좌표는 그대로다.
      sprite
        .setTexture(coinTexture, 'art')
        .setVisible(true)
        .setDisplaySize(width * zoom, height * zoom)
        .setPosition(projectX(coin.x), projectY(coin.y + (102 - height) / 2));
    });
    for (let index = visible.length; index < this.stacked.length; index++)
      this.stacked[index]!.setVisible(false);
    const miss = failureVisual(run.failureRemaining, run.failureDirection);
    const failing = run.mode === 'result';
    this.activeCoin
      .setDepth(2)
      .setPosition(
        projectX(run.activeX + (failing ? miss.x : 0)),
        projectY(run.activeY + (failing ? miss.y : 0)),
      )
      .setDisplaySize(rules.diameter * zoom, 102 * zoom)
      .setAngle(failing ? miss.angle : 0)
      .setAlpha(failing ? miss.alpha : 1)
      .setVisible(
        !title &&
          (failing
            ? run.failureRemaining > 0 && !reducedMotion
            : run.phase !== 'settling'),
      );
    this.hint.clear().setVisible(this.controller.showHints && run.score > 0);
    if (this.hint.visible) {
      const x = run.targetX;
      const y = run.targetY + run.cameraOffset + 6;
      this.hint.lineStyle(8, 0x163c68, 1).lineBetween(x, y - 16, x, y + 16);
      this.hint.lineStyle(4, 0xffffff, 1).lineBetween(x, y - 15, x, y + 15);
    }
    const feedbackVisible =
      run.mode === 'playing' && !run.frozen && run.feedbackRemaining > 0;
    this.feedback
      .setVisible(feedbackVisible)
      .setAlpha(Math.min(1, run.feedbackRemaining / 280));
    this.sparkles
      .clear()
      .setVisible(feedbackVisible && visual.particleAlpha > 0)
      .setAlpha(run.feedback === 'perfect' ? 1 : visual.particleAlpha);
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
      if (coin && visual.particleAlpha > 0) {
        if (perfect) {
          const height = 102 * visual.height;
          this.drawPerfectImpact(
            coin.x,
            coin.y + run.cameraOffset + (102 - height) / 2,
            rules.diameter * visual.width,
            height,
            visual.particleT,
            reducedMotion,
          );
        } else
          this.drawNiceImpact(
            coin.x,
            coin.y + run.cameraOffset + 43,
            visual.particleT,
            reducedMotion,
          );
      }
    }
  }

  private drawNiceImpact(
    x: number,
    y: number,
    t: number,
    reducedMotion: boolean,
  ) {
    const graphics = this.sparkles;
    const config = feedbackRules.nice;
    for (const side of [-1, 1]) {
      const edgeX = x + side * rules.diameter * 0.51;
      graphics.lineStyle(1.5, config.highlight, 0.7);
      graphics.lineBetween(edgeX - 6, y, edgeX + 6, y);
    }
    if (reducedMotion) return;
    for (let i = 0; i < config.particles; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const lane = Math.floor(i / 2);
      const px =
        x +
        side *
          (rules.diameter * 0.55 + t * (config.particleSpread + lane * 10));
      const py = y - 8 - t * (config.particleRise + lane * 14) + t * t * 16;
      const size = config.particleSize * (1 - t * 0.45);
      graphics.fillStyle(config.color, 1).fillCircle(px, py, size);
    }
  }

  /** 접점의 빠른 빛줄기와 동전 윤곽의 느린 잔광을 같은 착지 시간으로 그린다. */
  private drawPerfectImpact(
    x: number,
    y: number,
    width: number,
    height: number,
    t: number,
    reducedMotion: boolean,
  ) {
    const graphics = this.sparkles;
    const palette = skinById(this.controller.runSkin).perfectPalette;
    const contactY = y + height * 0.36;
    if (reducedMotion) {
      for (const side of [-1, 1]) {
        const edge = x + side * width * 0.49;
        graphics.lineStyle(6, palette.color, (1 - t) * 0.6);
        graphics.lineBetween(edge - 10, contactY, edge + 10, contactY);
        graphics.lineStyle(2, palette.highlight, 1 - t);
        graphics.lineBetween(edge - 8, contactY, edge + 8, contactY);
      }
      return;
    }

    const burst = Math.max(0, 1 - t / 0.55);
    const afterglow = Math.sin(Math.PI * (0.15 + t * 0.85)) * (1 - t * 0.4);
    // 원본 윗면 테두리를 따라가며 왕관과 다음 착지 목표는 채우지 않는다.
    for (const [lineWidth, alpha] of [
      [14, 0.12],
      [7, 0.3],
      [2.5, 0.9],
    ] as const) {
      graphics.lineStyle(lineWidth, palette.color, alpha * afterglow);
      graphics.strokeEllipse(x, y - height * 0.15, width * 0.96, height * 0.64);
    }
    graphics.lineStyle(1.3, palette.highlight, afterglow * 0.85);
    graphics.strokeEllipse(x, y - height * 0.15, width * 0.95, height * 0.63);

    const travel = 1 - (1 - t) ** 3;
    for (const side of [-1, 1]) {
      const edge = x + side * width * 0.49;
      if (burst > 0) {
        graphics.fillStyle(palette.color, burst * 0.24);
        graphics.fillEllipse(edge, contactY, 52 * (1 + t), 30);
        graphics.fillStyle(palette.highlight, burst * 0.85);
        graphics.fillEllipse(edge, contactY, 13, 7);
        for (let lane = 0; lane < 3; lane++) {
          const startX = edge + side * (4 + travel * (18 + lane * 9));
          const startY = contactY - travel * lane * 14;
          const endX = startX + side * (25 + lane * 12) * (1 - t * 0.5);
          const endY = startY - 5 - lane * 13;
          for (const [lineWidth, color, alpha] of [
            [10, palette.color, 0.14],
            [6, palette.color, 0.9],
            [2, palette.highlight, 1],
          ] as const) {
            graphics.lineStyle(lineWidth, color, alpha * burst);
            graphics.lineBetween(startX, startY, endX, endY);
          }
        }
      }
    }
    const config = feedbackRules.perfect;
    for (let i = 0; i < config.particles; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const lane = Math.floor(i / 2);
      const px = x + side * (width * 0.53 + travel * (22 + lane * 16));
      const py = contactY - 14 - travel * (20 + lane * 26);
      const size = config.particleSize * (1 - t * 0.7) * (1 - lane * 0.12);
      graphics.fillStyle(palette.color, (1 - t) * 0.16);
      graphics.fillCircle(px, py, size * 1.8);
      graphics.fillStyle(palette.color, 1 - t);
      this.drawStar(px, py, size);
      graphics.fillStyle(palette.highlight, (1 - t) * 0.95);
      this.drawStar(px, py, size * 0.5);
    }
  }

  private drawStar(x: number, y: number, size: number) {
    const inset = size * 0.23;
    const points = this.starPoints;
    points[0]!.set(x, y - size);
    points[1]!.set(x + inset, y - inset);
    points[2]!.set(x + size, y);
    points[3]!.set(x + inset, y + inset);
    points[4]!.set(x, y + size);
    points[5]!.set(x - inset, y + inset);
    points[6]!.set(x - size, y);
    points[7]!.set(x - inset, y - inset);
    this.sparkles.fillPoints(points, true);
  }
}
