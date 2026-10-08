import type { App } from '../app';
import { gameConfig } from '../config/game';
import { fullscreenAvailable, toggleFullscreen } from '../core/screen';
import type { GameController } from '../game/controller';

/** 네이티브 HTML 버튼을 게임 화면 위에 배치해 입력과 접근성을 함께 유지한다. */
export class Shell {
  private controller = new AbortController();
  private root: HTMLElement;
  constructor(
    private app: App,
    private game: GameController,
  ) {
    this.root = document.querySelector<HTMLElement>('#app')!;
    const asset = `${import.meta.env.BASE_URL}assets/coin-tower/`;
    // CSS의 상대 URL이 배포 CSS 파일 위치를 기준으로 해석되지 않도록 고정한다.
    const panel = new URL(`${asset}hud_panel.png`, document.baseURI).href;
    this.root.style.setProperty('--panel-art', `url("${panel}")`);
    this.root.innerHTML = `
      <h1 class="sr-only">Coin Tower</h1>
      <section id="stage" aria-label="Coin Tower game">
        <div id="surface">
          <div id="game" tabindex="0" aria-label="Game area. Click or tap to drop a coin."></div>
          <div id="title-screen" class="layer title-screen">
            <section class="title-records" aria-labelledby="title-records-heading">
              <h2 id="title-records-heading">BEST ON THIS BROWSER</h2>
              <div class="title-record-columns">
                <div class="blue-panel"><span>BEST COINS</span><strong id="title-best">0</strong></div>
                <div class="blue-panel"><span>BEST COMBO</span><strong id="title-best-combo">x0</strong></div>
              </div>
            </section>
            <div class="start-prompt"><button id="play" class="game-button primary">PLAY</button><p>Click or tap to stack coins</p></div>
          </div>
          <div id="hud" class="layer" hidden>
            <div class="hud-stats"><div class="blue-panel"><span>BEST</span><strong id="best">0</strong></div><div class="blue-panel"><span>COINS</span><strong id="score">0</strong></div></div>
            <button id="pause" class="icon-button pause-button" aria-label="Pause">Ⅱ</button>
            <div id="combo" class="blue-panel combo" hidden>COMBO <strong id="combo-count">x2</strong></div>
            <p id="tap-prompt" class="tap-prompt">Click or tap to drop</p>
          </div>
          <section id="result-screen" class="layer veil" aria-label="Game results" hidden>
            <img class="result-heading" src="${asset}game_over.png" alt="GAME OVER" />
            <div class="result-stats blue-panel">
              <table aria-label="Run records">
                <thead><tr><th scope="col"><span class="sr-only">RECORD</span></th><th scope="col">THIS RUN</th><th scope="col">BEST</th></tr></thead>
                <tbody>
                  <tr><th scope="row">COINS<span id="new-best-coins" class="record-badge" hidden>NEW BEST</span></th><td><strong id="result-score">0</strong></td><td><strong id="result-best">0</strong></td></tr>
                  <tr><th scope="row">PERFECT COMBO<span id="new-best-combo" class="record-badge" hidden>NEW BEST</span></th><td><strong id="result-combo">x0</strong></td><td><strong id="result-best-combo">x0</strong></td></tr>
                </tbody>
              </table>
            </div>
            <p class="result-caption">One more try. A little higher.</p>
            <div class="result-actions"><button id="retry" class="game-button primary">TRY AGAIN</button><button id="home" class="game-button">MENU</button></div>
          </section>
          <section id="pause-overlay" class="layer veil" aria-label="Pause menu" hidden>
            <img class="pause-heading" src="${asset}paused.png" alt="PAUSED" />
            <div class="pause-actions"><button id="continue" class="game-button primary">CONTINUE</button><button id="restart" class="game-button">RESTART</button><button id="pause-home" class="game-button">MENU</button></div>
          </section>
          <section id="confirm-overlay" class="layer veil" role="dialog" aria-modal="true" aria-labelledby="confirm-title" hidden>
            <div class="confirm-card"><h2 id="confirm-title">End this run?</h2><p>This run will not be saved.<br />Your best score will be kept.</p><button id="confirm-yes" class="game-button primary">CONFIRM</button><button id="confirm-no" class="game-button">CANCEL</button></div>
          </section>
          <div id="countdown-overlay" class="layer countdown" hidden><span>GET READY</span><strong id="countdown" aria-live="polite">3</strong></div>
          <div class="utility"><button id="mute" class="utility-button" aria-label="Mute sound" aria-pressed="false">SOUND ON</button><button id="fullscreen" class="utility-button" hidden>FULLSCREEN</button></div>
          <p id="storage-notice" role="status" class="storage-notice"></p>
          <div id="loading-overlay" class="layer blocking"><p>Getting the coins ready…</p></div>
          <div id="error-overlay" class="layer blocking" role="alert" hidden><p id="error-message"></p><button id="reload" class="game-button">RELOAD</button></div>
          <span id="mode-label" class="sr-only" aria-live="polite">MENU</span>
        </div>
      </section>`;
    this.bind();
    app.onState = () => this.render();
    this.render();
  }
  private element<T extends HTMLElement = HTMLElement>(id: string) {
    return this.root.querySelector<T>(`#${id}`)!;
  }
  private record(id: string, value: string) {
    const element = this.element(id);
    element.textContent = value;
    element.style.setProperty('--record-digits', String(value.length));
  }
  private on(id: string, handler: () => void) {
    this.element(id).addEventListener('click', handler, {
      signal: this.controller.signal,
    });
  }
  private bind() {
    const signal = this.controller.signal;
    this.element('game').addEventListener(
      'pointerdown',
      (event) => {
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          !(event.target instanceof HTMLCanvasElement)
        )
          return;
        event.preventDefault();
        this.element('game').focus({ preventScroll: true });
        this.game.tap();
      },
      { signal },
    );
    this.element('game').addEventListener(
      'keydown',
      (event) => {
        if (event.repeat || !['Space', 'Enter'].includes(event.code)) return;
        event.preventDefault();
        this.game.tap();
      },
      { signal },
    );
    this.on('play', () => this.game.start());
    this.on('retry', () => this.game.start());
    this.on('home', () => this.game.home());
    this.on('pause', () => this.game.pause());
    this.on('continue', () => this.game.resume());
    this.on('restart', () => this.game.request('restart'));
    this.on('pause-home', () => this.game.request('home'));
    this.on('confirm-yes', () => this.game.confirm(true));
    this.on('confirm-no', () => this.game.confirm(false));
    this.on('reload', () => location.reload());
    this.on('mute', () => {
      if (this.app.platform.muted) return;
      this.app.settings.update((s) => ({ ...s, muted: !s.muted }));
      this.app.audio?.apply(this.app.settings.data);
      this.app.settings.flush();
      this.render();
    });
    this.on('fullscreen', () => {
      if (this.app.game && !this.app.platform.hideFullscreen)
        toggleFullscreen(this.app.game, gameConfig.orientation);
    });
    document.addEventListener('fullscreenchange', () => this.render(), {
      signal,
    });
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.code !== 'Escape' || this.app.session.mode !== 'playing')
          return;
        if (this.app.session.confirmation) this.game.confirm(false);
        else this.game.pause();
      },
      { signal },
    );
  }
  render() {
    const app = this.app;
    const run = app.session;
    const menu = run.mode === 'menu';
    const playing = run.mode === 'playing';
    this.element('surface').dataset.mode = run.mode;
    this.element('surface').dataset.phase = run.phase;
    this.element('title-screen').hidden = !menu;
    this.element('hud').hidden = !playing;
    this.element('result-screen').hidden = run.mode !== 'result';
    this.element('pause-overlay').hidden =
      !playing || !run.paused || !!run.confirmation;
    this.element('confirm-overlay').hidden = !run.confirmation;
    this.element('confirm-title').textContent =
      run.confirmation === 'home' ? 'Return to the menu?' : 'Start a new run?';
    this.element('countdown-overlay').hidden = !playing || run.countdownMs <= 0;
    this.element('countdown').textContent = String(
      Math.ceil(run.countdownMs / 1000),
    );
    this.element('pause').hidden = run.paused;
    this.element('combo').hidden = run.combo < 2;
    this.element('combo-count').textContent = `x${run.combo}`;
    this.element('combo').style.setProperty(
      '--combo-digits',
      String(String(run.combo).length + 1),
    );
    this.element('tap-prompt').hidden = run.score >= 5 || run.frozen;
    const progress = app.save.data;
    const result = this.game.result;
    this.element('score').textContent = String(run.score);
    this.element('best').textContent = String(progress.best);
    this.record('title-best', String(progress.best));
    this.record('title-best-combo', `x${progress.bestCombo}`);
    this.record('result-score', String(result?.score ?? 0));
    this.record('result-best', String(result?.best ?? 0));
    this.record('result-combo', `x${result?.combo ?? 0}`);
    this.record('result-best-combo', `x${result?.bestCombo ?? 0}`);
    this.element('new-best-coins').hidden = !result?.newBest;
    this.element('new-best-combo').hidden = !result?.newBestCombo;
    this.element<HTMLButtonElement>('play').disabled =
      !app.ready || !!app.fatalError;
    this.element('loading-overlay').hidden = app.ready || !!app.loadingError;
    this.element('error-overlay').hidden = !(
      app.loadingError || app.fatalError
    );
    this.element('error-message').textContent =
      app.loadingError || app.fatalError;
    this.element('storage-notice').textContent =
      app.save.status === 'ready' && this.game.saved
        ? ''
        : 'Scores cannot be saved. You can keep playing.';
    this.element('mode-label').textContent = run.paused
      ? 'PAUSED'
      : run.countdownMs > 0
        ? 'COUNTDOWN'
        : run.mode.toUpperCase();
    const muted = app.settings.data.muted || app.platform.muted;
    this.element<HTMLButtonElement>('mute').disabled = app.platform.muted;
    this.element('mute').textContent = app.platform.muted
      ? 'SOUND OFF (PLATFORM)'
      : muted
        ? 'SOUND OFF'
        : 'SOUND ON';
    this.element('mute').setAttribute(
      'aria-label',
      app.platform.muted
        ? 'Sound muted by platform'
        : muted
          ? 'Unmute sound'
          : 'Mute sound',
    );
    this.element('mute').setAttribute('aria-pressed', String(muted));
    this.element('fullscreen').hidden = !(
      !app.platform.hideFullscreen &&
      app.ready &&
      app.game &&
      fullscreenAvailable(app.game)
    );
    this.element('fullscreen').textContent = app.game?.scale.isFullscreen
      ? 'EXIT FULLSCREEN'
      : 'FULLSCREEN';
  }
  destroy() {
    this.controller.abort();
    this.app.onState = () => {};
  }
}
