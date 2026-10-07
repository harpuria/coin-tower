import type { App } from '../app';
import { gameConfig } from '../config/game';
import { fullscreenAvailable, toggleFullscreen } from '../core/screen';
import { assetKeys } from '../game/assets';
import { GameScene, MenuScene } from '../game/scenes';
import { MockAdapter } from '../services/platform';

export class Shell {
  private controller = new AbortController();
  private root: HTMLElement;
  private servicePending = false;
  constructor(private app: App) {
    this.root = document.querySelector<HTMLElement>('#app')!;
    this.root.innerHTML = `
      <header class="header"><a class="brand" href="./"><span class="brand-icon">●</span> COIN TOWER <span class="muted">/ WEB</span></a><span class="version">v${gameConfig.version} <span class="dot"></span> READY TO BUILD</span></header>
      <section class="intro"><p class="eyebrow">COIN TOWER · WEB SETUP</p><h1>Coin Tower, 웹으로<span>.</span></h1><p class="subtitle">현재는 별 모으기 예제로 세로 화면과 브라우저 입력을 확인할 수 있습니다.</p></section>
      <div class="workspace"><section class="stage-card" aria-label="게임 데모">
        <div class="stage-heading"><span><span class="dot"></span> STAR COLLECTOR <small>개발 기반 확인용 예제</small></span><span id="mode-label">MENU</span></div>
        <div class="canvas-wrap" id="stage" data-orientation="${gameConfig.orientation}"><div id="game" tabindex="0" aria-label="별 모으기 게임. 방향키, WASD, 게임패드로 이동하거나 화면을 누르세요."></div><div id="pause-overlay" class="overlay" hidden>잠시 쉬어가는 중<span>계속하기를 누르면 다시 시작합니다.</span></div><div id="rotate-hint" class="overlay">기기를 ${gameConfig.orientation === 'landscape' ? '가로' : '세로'}로 돌려 주세요<span>전체화면에서 권장 방향으로 플레이합니다.</span></div><button id="exit-fullscreen" class="secondary" aria-label="전체화면 나가기">✕</button><div id="error-overlay" class="overlay" role="alert" hidden>문제가 발생했습니다<span id="error-message"></span><button id="reload" class="primary">새로고침</button></div></div>
        <div class="game-toolbar"><p><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> 이동 <span class="touch-hint">· 화면을 눌러 이동</span></p><div><button id="fullscreen" class="secondary" hidden>전체화면</button><button id="pause" class="secondary" hidden>일시정지</button><button id="home" class="secondary" hidden>메뉴</button><button id="play" class="primary">플레이 시작 <span>↗</span></button></div></div>
      </section>
      <aside class="sidebar"><section class="panel"><div class="panel-title"><h2>예제 플레이 기록</h2><span class="tag">LOCAL SAVE</span></div><div class="stats"><div><strong id="best">0</strong><span>최고 기록</span></div><div><strong id="rounds">0</strong><span>플레이 횟수</span></div></div><p id="storage-status" class="caption"></p><button id="settings" class="wide secondary">설정 열기 <span>⚙</span></button></section>
      <section class="panel"><div class="panel-title"><h2>기본 기능</h2><span class="tag green">INCLUDED</span></div><ul class="features"><li>버전 관리가 있는 로컬 저장</li><li>음량 · 효과음 · 배경음 설정</li><li>화면 전환 · 자동 일시정지</li><li>키보드 · 마우스 · 터치 · 게임패드 입력</li><li>전체화면 · 오류 안내 화면</li><li>광고 · 결제 서비스 연결 지점</li></ul></section></aside></div>
      <section class="toolbox"><div><p class="eyebrow">SERVICE PLAYGROUND</p><h2>예제 소리와 서비스 상태</h2><p class="caption" id="service-mode"></p></div><div class="service-actions"><label class="check"><input id="consent" type="checkbox" /> Mock 분석·광고 동의</label><select id="outcome" aria-label="Mock 결과"><option value="completed">성공</option><option value="cancelled">취소</option><option value="error">오류</option></select><button id="reward" class="secondary">보상형 광고 테스트</button><button id="purchase" class="secondary">구매 테스트</button><button id="sound" class="secondary">효과음 듣기</button></div><p id="notice" role="status" aria-live="polite">준비되었습니다. 플레이를 시작해 보세요.</p></section>
      <footer><span>PHASER 4.2.1 · TYPESCRIPT · VITE</span><span>당신의 게임은 <code>src/game/</code>에서 시작됩니다.</span></footer>
      <dialog id="settings-dialog" aria-labelledby="settings-title"><form method="dialog"><div class="panel-title"><h2 id="settings-title">게임 설정</h2><button class="icon-button" aria-label="설정 닫기">✕</button></div><p class="caption">변경한 설정은 이 브라우저에 저장됩니다.</p><label class="check"><input id="muted" type="checkbox" /> 전체 음소거</label><label class="range-label">전체 음량<input id="master" type="range" min="0" max="1" step="0.05" /></label><label class="range-label">배경음<input id="music" type="range" min="0" max="1" step="0.05" /></label><label class="range-label">효과음<input id="sfx" type="range" min="0" max="1" step="0.05" /></label><label class="check"><input id="reducedMotion" type="checkbox" /> 화면 움직임 줄이기</label><hr /><p class="caption">플레이 기록 초기화는 설정을 유지합니다.</p><button id="reset" type="button" class="danger wide">플레이 기록 초기화</button><button id="reset-settings" type="button" class="secondary wide">설정 초기화 / 저장 오류 복구</button><button class="primary wide">완료</button></form></dialog>`;
    this.root.style.setProperty('--game-w', String(gameConfig.width));
    this.root.style.setProperty('--game-h', String(gameConfig.height));
    this.bind();
    app.onState = () => this.render();
    this.render();
  }
  private element<T extends HTMLElement = HTMLElement>(id: string) {
    return this.root.querySelector<T>(`#${id}`)!;
  }
  private on(id: string, event: string, handler: () => void) {
    this.element(id).addEventListener(event, handler, {
      signal: this.controller.signal,
    });
  }
  private notify(message: string) {
    this.element('notice').textContent = message;
  }
  private bind() {
    const app = this.app;
    this.on('game', 'pointerdown', () => this.element('game').focus());
    this.on('game', 'blur', () => {
      for (const scene of app.game?.scene.getScenes(false) ?? [])
        scene.input?.keyboard?.resetKeys();
    });
    this.on('play', 'click', () => {
      const mode = app.session.mode;
      if (!app.game?.scene.isActive('Menu') && mode !== 'result') return;
      if (mode === 'menu')
        (app.game!.scene.getScene('Menu') as MenuScene).startGame();
      else app.game!.scene.getScene('Game').scene.restart();
      this.element('game').focus();
    });
    this.on('pause', 'click', () => {
      app.pause.set('manual', !app.pause.has('manual'));
      this.element('game').focus();
    });
    this.on('home', 'click', () => {
      app.pause.set('manual', false);
      (app.game?.scene.getScene('Game') as GameScene).goHome();
    });
    this.on('fullscreen', 'click', () => {
      if (app.game) toggleFullscreen(app.game, gameConfig.orientation);
    });
    this.on('reload', 'click', () => location.reload());
    this.on('exit-fullscreen', 'click', () => {
      if (app.game?.scale.isFullscreen) app.game.scale.stopFullscreen();
    });
    this.on('settings', 'click', () => {
      for (const [key, value] of Object.entries(app.settings.data)) {
        const input = this.element<HTMLInputElement>(key);
        if (typeof value === 'boolean') input.checked = value;
        else input.value = String(value);
      }
      app.pause.set('settings', true);
      this.element<HTMLDialogElement>('settings-dialog').showModal();
    });
    this.on('settings-dialog', 'close', () => {
      app.pause.set('settings', false);
      app.flush();
    });
    for (const key of [
      'master',
      'music',
      'sfx',
      'muted',
      'reducedMotion',
    ] as const) {
      this.on(key, 'input', () => {
        const input = this.element<HTMLInputElement>(key);
        app.settings.update((settings) => ({
          ...settings,
          [key]:
            input.type === 'checkbox' ? input.checked : Number(input.value),
        }));
        app.audio?.apply(app.settings.data);
        app.settings.flush();
        this.render();
      });
    }
    this.on('reset', 'click', () => {
      if (!confirm('플레이 기록을 지울까요? 이 작업은 되돌릴 수 없습니다.'))
        return;
      this.notify(
        app.save.reset()
          ? '플레이 기록을 초기화했습니다.'
          : '저장 공간에 접근할 수 없습니다.',
      );
      this.render();
    });
    this.on('reset-settings', 'click', () => {
      if (!confirm('저장된 설정을 초기화할까요?')) return;
      this.notify(
        app.settings.reset()
          ? '설정을 초기화했습니다.'
          : '저장 공간에 접근할 수 없습니다.',
      );
      app.audio?.apply(app.settings.data);
      this.element<HTMLDialogElement>('settings-dialog').close();
      this.render();
    });
    this.on('consent', 'change', () => {
      app.platform.consent = this.element<HTMLInputElement>('consent').checked;
    });
    this.on('outcome', 'change', () => {
      if (app.platform.adapter instanceof MockAdapter)
        app.platform.adapter.outcome = this.element<HTMLSelectElement>(
          'outcome',
        ).value as MockAdapter['outcome'];
    });
    const request = async (type: 'reward' | 'purchase') => {
      if (this.servicePending) return;
      this.servicePending = true;
      this.element<HTMLButtonElement>('reward').disabled = true;
      this.element<HTMLButtonElement>('purchase').disabled = true;
      app.pause.set('service', true);
      this.notify('서비스 상태 확인 중…');
      const result = await (type === 'reward'
        ? app.platform.rewarded()
        : app.platform.purchase('demo-product'));
      app.pause.set('service', false);
      this.servicePending = false;
      this.element<HTMLButtonElement>('reward').disabled = false;
      this.element<HTMLButtonElement>('purchase').disabled = false;
      this.notify(
        `${type === 'reward' ? '보상형 광고' : '구매'}: ${result.status}${'mock' in result ? ' (Mock · 실제 보상/결제 없음)' : ''}`,
      );
    };
    this.on('reward', 'click', () => {
      void request('reward');
    });
    this.on('purchase', 'click', () => {
      void request('purchase');
    });
    this.on('sound', 'click', () => {
      app.audio?.sfx(assetKeys.collect);
      this.notify('효과음을 재생했습니다. 음소거와 볼륨 설정을 확인해 주세요.');
    });
    document.addEventListener(
      'keydown',
      (event) => {
        if (
          event.code !== 'Escape' ||
          this.element<HTMLDialogElement>('settings-dialog').open ||
          app.session.mode !== 'playing'
        )
          return;
        app.pause.set('manual', !app.pause.has('manual'));
      },
      { signal: this.controller.signal },
    );
  }
  render() {
    const app = this.app;
    const mode = app.session.mode;
    this.element<HTMLButtonElement>('play').disabled = !app.ready;
    this.element<HTMLButtonElement>('sound').disabled = !app.ready;
    if (app.loadingError) this.notify(app.loadingError);
    this.element('best').textContent = String(app.save.data.best);
    this.element('rounds').textContent = String(app.save.data.rounds);
    const ready =
      app.save.status === 'ready' && app.settings.status === 'ready';
    this.element('storage-status').textContent = ready
      ? '이 브라우저에 자동으로 저장됩니다.'
      : `저장 보호 모드 · 기록: ${app.save.status}, 설정: ${app.settings.status}. 설정에서 초기화할 수 있습니다.`;
    this.element('mode-label').textContent = app.pause.paused
      ? 'PAUSED'
      : mode.toUpperCase();
    this.element('pause-overlay').hidden =
      !app.pause.paused || mode !== 'playing';
    this.element('pause').hidden = mode !== 'playing';
    this.element('pause').textContent = app.pause.has('manual')
      ? '계속하기'
      : '일시정지';
    this.element('home').hidden = mode === 'menu';
    this.element('play').hidden = mode === 'playing';
    this.element('fullscreen').hidden = !(
      app.ready &&
      app.game &&
      fullscreenAvailable(app.game)
    );
    this.element('error-overlay').hidden = !app.fatalError;
    this.element('error-message').textContent = app.fatalError;
    this.element('play').textContent =
      mode === 'result' ? '다시 플레이 ↗' : '플레이 시작 ↗';
    this.element('service-mode').textContent = app.platform.isMock
      ? '개발용 Mock입니다. 외부 서비스로 데이터를 보내거나 실제 결제하지 않습니다.'
      : '외부 서비스가 비활성화되어 있습니다. 광고·구매는 unavailable을 반환합니다.';
    this.element('consent').closest('label')!.hidden = !app.platform.isMock;
    this.element('outcome').hidden = !app.platform.isMock;
  }
  destroy() {
    this.controller.abort();
    this.app.onState = () => {};
  }
}
