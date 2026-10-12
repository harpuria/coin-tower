import type { App } from '../app';
import { gameConfig } from '../config/game';
import { fullscreenAvailable, toggleFullscreen } from '../core/screen';
import type { GameController } from '../game/controller';
import { landingVisual } from '../game/feedback';

/** 네이티브 HTML 버튼을 게임 화면 위에 배치해 입력과 접근성을 함께 유지한다. */
export class Shell {
  private controller = new AbortController();
  private root: HTMLElement;
  private displayedCombo = -1;
  private comboFrame = 0;
  constructor(
    private app: App,
    private game: GameController,
  ) {
    this.root = document.querySelector<HTMLElement>('#app')!;
    const asset = `${import.meta.env.BASE_URL}assets/coin-tower/`;
    const icon = (kind: 'coins' | 'combo' | 'shards') => {
      const file = {
        coins: 'best-coins',
        combo: 'best-combo',
        shards: 'star-shards',
      }[kind];
      return `<span class="stat-icon stat-icon-${kind}" aria-hidden="true"><img src="${asset}icons/${file}.png" alt="" draggable="false" /></span>`;
    };
    // CSS의 상대 URL이 배포 CSS 파일 위치를 기준으로 해석되지 않도록 고정한다.
    const panel = new URL(`${asset}hud_panel.png`, document.baseURI).href;
    this.root.style.setProperty('--panel-art', `url("${panel}")`);
    this.root.innerHTML = `
      <h1 class="sr-only">Coin Tower</h1>
      <section id="stage" aria-label="Coin Tower game">
        <div id="surface">
          <div id="game" tabindex="0" aria-label="Game area. Click, tap or press Space to drop a coin."></div>
          <div id="title-screen" class="layer title-screen">
            <section class="title-records" aria-labelledby="title-records-heading">
              <h2 id="title-records-heading">BEST ON THIS BROWSER</h2>
              <div class="title-record-columns">
                <div class="stat-readout icon-stat" title="Best coins"><span class="sr-only">BEST COINS</span>${icon('coins')}<strong id="title-best">0</strong></div>
                <div class="stat-readout icon-stat" title="Best Perfect combo"><span class="sr-only">BEST COMBO</span>${icon('combo')}<strong id="title-best-combo">x0</strong></div>
              </div>
            </section>
            <div class="title-shards shard-readout icon-stat" title="Star Shards balance"><span class="sr-only">STAR SHARDS</span>${icon('shards')}<strong id="title-shards">0</strong></div>
            <div class="start-prompt"><button id="play" class="game-button primary">PLAY</button><p>Click, tap or press Space to stack coins</p></div>
          </div>
          <div id="hud" class="layer" hidden>
            <section class="hud-records" aria-label="Browser bests and collected Star Shards">
              <div class="stat-readout icon-stat" title="Best coins"><span class="hud-best-label" aria-hidden="true">BEST</span><span class="sr-only">BEST COINS</span>${icon('coins')}<strong id="best">0</strong></div>
              <div class="stat-readout icon-stat" title="Best Perfect combo"><span class="sr-only">BEST COMBO</span>${icon('combo')}<strong id="hud-best-combo">x0</strong></div>
              <div class="shard-readout icon-stat" title="Collected Star Shards"><span class="sr-only">STAR SHARDS</span>${icon('shards')}<strong id="hud-shards">0</strong></div>
            </section>
            <div class="hud-stats stat-readout"><span>COINS</span><strong id="score">0</strong></div>
            <button id="pause" class="icon-button pause-button" aria-label="Pause">Ⅱ</button>
            <div id="combo" class="combo" hidden><strong id="combo-count" class="sr-only">x1</strong><span class="combo-glyphs" aria-hidden="true"></span></div>
            <p id="tap-prompt" class="tap-prompt">Click, tap or press Space to drop</p>
          </div>
          <section id="result-screen" class="layer veil" aria-label="Game results" hidden>
            <img class="result-heading" src="${asset}game_over.png" alt="GAME OVER" />
            <div class="result-stats stat-readout">
              <table aria-label="Run records">
                <thead><tr><th scope="col"><span class="sr-only">RECORD</span></th><th scope="col">THIS RUN</th><th scope="col">BEST</th></tr></thead>
                <tbody>
                  <tr><th scope="row"><span class="sr-only">COINS</span>${icon('coins')}<span id="new-best-coins" class="record-badge" hidden>NEW BEST</span></th><td><strong id="result-score">0</strong></td><td><strong id="result-best">0</strong></td></tr>
                  <tr><th scope="row"><span class="sr-only">PERFECT COMBO</span>${icon('combo')}<span id="new-best-combo" class="record-badge" hidden>NEW BEST</span></th><td><strong id="result-combo">x0</strong></td><td><strong id="result-best-combo">x0</strong></td></tr>
                </tbody>
              </table>
            </div>
            <p class="result-caption">One more try. A little higher.</p>
            <section class="shard-reward shard-readout" aria-label="Star Shards reward">
              <span class="shard-label"><span class="sr-only">STAR SHARDS</span>${icon('shards')}</span>
              <div><span>EARNED</span><strong id="result-shards-earned">+0</strong></div>
              <div><span>TOTAL</span><strong id="result-shards-total">0</strong></div>
            </section>
            <div class="result-actions"><button id="retry" class="game-button primary">TRY AGAIN</button><button id="home" class="game-button">MENU</button></div>
          </section>
          <section id="pause-overlay" class="layer veil" aria-label="Pause menu" hidden>
            <img class="pause-heading" src="${asset}paused.png" alt="PAUSED" />
            <div class="pause-actions"><button id="continue" class="game-button primary">CONTINUE</button><button id="restart" class="game-button">RESTART</button><button id="pause-home" class="game-button">MENU</button></div>
          </section>
          <section id="confirm-overlay" class="layer veil" role="dialog" aria-modal="true" aria-labelledby="confirm-title" hidden>
            <div class="confirm-card"><h2 id="confirm-title">End this run?</h2><p>No Star Shards earned for this run.<br />Your best scores and collected shards will be kept.</p><button id="confirm-yes" class="game-button primary">CONFIRM</button><button id="confirm-no" class="game-button">CANCEL</button></div>
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
  /** 숫자 이미지는 게임 시간의 Perfect 잔여 시간과 함께 사라진다. */
  private renderComboFeedback() {
    cancelAnimationFrame(this.comboFrame);
    this.comboFrame = 0;
    const run = this.app.session;
    const element = this.element('combo');
    element.hidden =
      run.mode !== 'playing' ||
      run.frozen ||
      run.feedback !== 'perfect' ||
      run.feedbackRemaining <= 0;
    element.style.opacity = String(Math.min(1, run.feedbackRemaining / 280));
    const visual = landingVisual(
      run.feedback,
      run.feedbackRemaining,
      this.app.settings.data.reducedMotion,
    );
    // 패널 대신 글자 묶음만 확대해 중앙 정렬과 자릿수별 폭 제한을 유지한다.
    element.querySelector<HTMLElement>('.combo-glyphs')!.style.transform =
      `scale(${visual.pop})`;
    if (!element.hidden)
      this.comboFrame = requestAnimationFrame(() => this.renderComboFeedback());
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
        if (event.repeat || event.code !== 'Enter') return;
        event.preventDefault();
        this.game.tap();
      },
      { signal },
    );
    // 시작 버튼의 포커스가 남아 Space를 다시 눌렀을 때 새 판을 열지 않게 한다.
    const focusGame = () => this.element('game').focus({ preventScroll: true });
    const start = () => {
      this.game.start();
      if (this.app.session.mode === 'playing') focusGame();
    };
    this.on('play', start);
    this.on('retry', start);
    this.on('home', () => this.game.home());
    this.on('pause', () => this.game.pause());
    this.on('continue', () => {
      this.game.resume();
      focusGame();
    });
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
        if (
          event.code !== 'Space' ||
          event.defaultPrevented ||
          event.isComposing ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          !this.app.ready ||
          this.app.loadingError ||
          this.app.fatalError ||
          document.hidden
        )
          return;
        const target = event.target;
        // 버튼·입력 필드는 고유한 키보드 동작을 유지하고 게임 입력과 겹치지 않는다.
        if (
          !(target instanceof HTMLElement) ||
          (target !== document.body &&
            target !== document.documentElement &&
            !this.root.contains(target)) ||
          target.closest(
            'button, a, input, select, textarea, [role="button"], [contenteditable]:not([contenteditable="false"])',
          )
        )
          return;
        const run = this.app.session;
        if (run.mode !== 'menu' && (run.mode !== 'playing' || run.frozen))
          return;
        event.preventDefault();
        if (!event.repeat) this.game.tap();
      },
      { signal },
    );
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
    this.renderComboFeedback();
    if (this.displayedCombo !== run.combo) {
      this.displayedCombo = run.combo;
      this.element('combo-count').textContent = `x${run.combo}`;
      const glyphs = [...`x${run.combo}`].map((glyph) => {
        const image = document.createElement('img');
        image.src = `${import.meta.env.BASE_URL}assets/coin-tower/combo/${glyph}.png`;
        image.alt = '';
        image.draggable = false;
        return image;
      });
      this.element('combo')
        .querySelector('.combo-glyphs')!
        .replaceChildren(...glyphs);
    }
    this.element('combo').style.setProperty(
      '--combo-digits',
      String(String(run.combo).length + 1),
    );
    this.element('tap-prompt').hidden = run.score >= 5 || run.frozen;
    const progress = app.save.data;
    const result = this.game.result;
    this.record('score', String(run.score));
    this.record('best', String(progress.best));
    this.record('hud-best-combo', `x${progress.bestCombo}`);
    this.record('hud-shards', String(progress.shards));
    this.record('title-best', String(progress.best));
    this.record('title-best-combo', `x${progress.bestCombo}`);
    this.record('title-shards', String(progress.shards));
    this.record('result-shards-earned', `+${result?.shardsEarned ?? 0}`);
    this.record('result-shards-total', String(result?.shardsTotal ?? 0));
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
        : 'Scores cannot be saved. Star Shards are temporary. You can keep playing.';
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
    cancelAnimationFrame(this.comboFrame);
    this.controller.abort();
    this.app.onState = () => {};
  }
}
