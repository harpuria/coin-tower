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
      <section id="stage" aria-label="Coin Tower 게임">
        <div id="surface">
          <div id="game" tabindex="0" aria-label="게임 영역. 클릭 또는 터치로 동전을 떨어뜨리세요."></div>
          <div id="title-screen" class="layer title-screen">
            <div class="title-best blue-panel"><span>이 브라우저의 최고 기록</span><strong id="title-best">0</strong><small>COINS</small></div>
            <div class="start-prompt"><button id="play" class="game-button primary">게임 시작</button><p>클릭 · 터치로 동전을 쌓아 보세요</p></div>
          </div>
          <div id="hud" class="layer" hidden>
            <div class="hud-stats"><div class="blue-panel"><span>BEST</span><strong id="best">0</strong></div><div class="blue-panel"><span>COINS</span><strong id="score">0</strong></div></div>
            <button id="pause" class="icon-button pause-button" aria-label="일시정지">Ⅱ</button>
            <div id="combo" class="blue-panel combo" hidden>COMBO <strong id="combo-count">x2</strong></div>
            <p id="tap-prompt" class="tap-prompt">클릭 · 터치로 낙하</p>
          </div>
          <section id="result-screen" class="layer veil" aria-label="게임 결과" hidden>
            <img class="result-heading" src="${asset}game_over.png" alt="GAME OVER" />
            <div class="result-stats blue-panel"><div><span>이번 기록</span><strong id="result-score">0</strong></div><div><span>최고 기록</span><strong id="result-best">0</strong></div></div>
            <p class="result-caption">한 번 더, 조금 더 높이.</p>
            <div class="result-actions"><button id="retry" class="game-button primary">다시 도전</button><button id="home" class="game-button">첫 화면</button></div>
          </section>
          <section id="pause-overlay" class="layer veil" aria-label="일시정지 메뉴" hidden>
            <img class="pause-heading" src="${asset}paused.png" alt="PAUSED" />
            <div class="pause-actions"><button id="continue" class="game-button primary">계속하기</button><button id="restart" class="game-button">다시 시작</button><button id="pause-home" class="game-button">첫 화면으로</button></div>
          </section>
          <section id="confirm-overlay" class="layer veil" role="dialog" aria-modal="true" aria-labelledby="confirm-title" hidden>
            <div class="confirm-card"><h2 id="confirm-title">현재 판을 중단할까요?</h2><p>진행 중인 판은 기록되지 않습니다.<br />기존 최고 기록은 유지됩니다.</p><button id="confirm-yes" class="game-button primary">확인</button><button id="confirm-no" class="game-button">취소</button></div>
          </section>
          <div id="countdown-overlay" class="layer countdown" hidden><span>준비하세요</span><strong id="countdown" aria-live="polite">3</strong></div>
          <div class="utility"><button id="mute" class="utility-button" aria-label="소리 끄기" aria-pressed="false">소리 켜짐</button><button id="fullscreen" class="utility-button" hidden>전체화면</button></div>
          <p id="storage-notice" role="status" class="storage-notice"></p>
          <div id="loading-overlay" class="layer blocking"><p>동전을 준비하고 있어요…</p></div>
          <div id="error-overlay" class="layer blocking" role="alert" hidden><p id="error-message"></p><button id="reload" class="game-button">새로고침</button></div>
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
      this.app.settings.update((s) => ({ ...s, muted: !s.muted }));
      this.app.audio?.apply(this.app.settings.data);
      this.app.settings.flush();
      this.render();
    });
    this.on('fullscreen', () => {
      if (this.app.game)
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
      run.confirmation === 'home'
        ? '첫 화면으로 돌아갈까요?'
        : '새 판을 시작할까요?';
    this.element('countdown-overlay').hidden = !playing || run.countdownMs <= 0;
    this.element('countdown').textContent = String(
      Math.ceil(run.countdownMs / 1000),
    );
    this.element('pause').hidden = run.paused;
    this.element('combo').hidden = run.combo < 2;
    this.element('combo-count').textContent = `x${run.combo}`;
    this.element('tap-prompt').hidden = run.score >= 5 || run.frozen;
    for (const id of ['score', 'result-score'])
      this.element(id).textContent = String(run.score);
    for (const id of ['best', 'title-best', 'result-best'])
      this.element(id).textContent = String(app.save.data.best);
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
        : '기록을 저장할 수 없습니다. 계속 플레이할 수 있어요.';
    this.element('mode-label').textContent = run.paused
      ? 'PAUSED'
      : run.countdownMs > 0
        ? 'COUNTDOWN'
        : run.mode.toUpperCase();
    const muted = app.settings.data.muted;
    this.element('mute').textContent = muted ? '소리 꺼짐' : '소리 켜짐';
    this.element('mute').setAttribute(
      'aria-label',
      muted ? '소리 켜기' : '소리 끄기',
    );
    this.element('mute').setAttribute('aria-pressed', String(muted));
    this.element('fullscreen').hidden = !(
      app.ready &&
      app.game &&
      fullscreenAvailable(app.game)
    );
    this.element('fullscreen').textContent = app.game?.scale.isFullscreen
      ? '전체화면 나가기'
      : '전체화면';
  }
  destroy() {
    this.controller.abort();
    this.app.onState = () => {};
  }
}
