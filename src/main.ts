import Phaser from 'phaser';
import { App } from './app';
import { gameConfig } from './config/game';
import { watchUncaughtErrors } from './core/errors';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { CoinTowerScene } from './game/scenes';
import { GameController } from './game/controller';
import { Shell } from './ui/Shell';
import './style.css';

// 개발 서버에서 `?debug`를 붙이면 물리 충돌 영역을 표시한다. 배포 빌드에서는 항상 꺼진다.
document.title = gameConfig.title;
const app = new App();
const controller = new GameController(app);
const shell = new Shell(app, controller);
const stopWatchingErrors = watchUncaughtErrors((message) => {
  controller.pause();
  app.fatalError = message;
  app.onState();
});
let game: Phaser.Game | undefined;
let disposed = false;
async function start() {
  try {
    await app.platform.initialize();
  } catch (error) {
    if (disposed) return;
    console.warn('[CrazyGames] Initialization failed', error);
    app.loadingError = 'Unable to connect. Please reload to try again.';
    app.onState();
    return;
  }
  if (disposed) return;
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: gameConfig.width,
    height: gameConfig.height,
    backgroundColor: gameConfig.background,
    pixelArt: gameConfig.pixelArt,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      fullscreenTarget: 'stage',
    },
    input: {
      activePointers: 2,
      keyboard: { target: document.getElementById('game')! },
    },
    scene: [
      new BootScene(app),
      new PreloadScene(app),
      new CoinTowerScene(app, controller),
    ],
  });
}
void start();

// Keep hot module replacement from accumulating canvases, timers and DOM listeners.
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    disposed = true;
    stopWatchingErrors();
    shell.destroy();
    app.destroy();
    game?.destroy(true);
  });
