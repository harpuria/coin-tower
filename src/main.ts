import Phaser from 'phaser';
import { App } from './app';
import { gameConfig } from './config/game';
import { watchUncaughtErrors } from './core/errors';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene, MenuScene } from './game/scenes';
import { Shell } from './ui/Shell';
import './style.css';

// 개발 서버에서 `?debug`를 붙이면 물리 충돌 영역을 표시한다. 배포 빌드에서는 항상 꺼진다.
const debug =
  import.meta.env.DEV && new URLSearchParams(location.search).has('debug');

document.title = gameConfig.title;
const app = new App();
const shell = new Shell(app);
const stopWatchingErrors = watchUncaughtErrors((message) => {
  app.fatalError = message;
  app.onState();
});
const game = new Phaser.Game({
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
  physics: { default: 'arcade', arcade: { debug } },
  input: {
    activePointers: 2,
    gamepad: true,
    keyboard: { target: document.getElementById('game')! },
  },
  scene: [
    new BootScene(app),
    new PreloadScene(app),
    new MenuScene(app),
    new GameScene(app),
  ],
});

// Keep hot module replacement from accumulating canvases, timers and DOM listeners.
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    stopWatchingErrors();
    shell.destroy();
    app.destroy();
    game.destroy(true);
  });
