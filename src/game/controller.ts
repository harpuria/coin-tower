import type { App } from '../app';
import { assetKeys } from './assets';
import type { RunAction } from './session';

/** 한 판의 행동을 공통 저장·오디오·수명 서비스에 연결한다. */
export class GameController {
  private viewKey = '';
  private gameplayActive = false;
  saved = true;
  constructor(readonly app: App) {
    app.onBackground = () => {
      this.run.pause();
      // SDK가 포커스/탭 전환을 처리한다. 복귀 후 명시적인 재개만 다시 보고한다.
      this.sync(false);
    };
  }
  get run() {
    return this.app.session;
  }
  private get background() {
    return this.app.pause.has('hidden') || this.app.pause.has('focus');
  }
  private sync(reportGameplay = true) {
    const active =
      this.run.mode === 'playing' && !this.run.frozen && !this.background;
    if (reportGameplay && active !== this.gameplayActive) {
      if (active) this.app.platform.gameplayStart();
      else this.app.platform.gameplayStop();
    }
    this.gameplayActive = active;
    this.app.pause.set('run', this.run.mode === 'playing' && this.run.frozen);
    const key = [
      this.run.mode,
      this.run.phase,
      this.run.score,
      this.run.combo,
      this.run.feedback,
      this.run.feedbackRemaining > 0,
      this.run.paused,
      Math.ceil(this.run.countdownMs / 1000),
      this.run.confirmation,
    ].join(':');
    if (key !== this.viewKey) {
      this.viewKey = key;
      this.app.onState();
    }
  }
  start() {
    if (!this.app.ready) return;
    this.run.start();
    if (this.background) this.run.pause();
    this.sync();
  }
  tap() {
    if (this.run.mode === 'menu') this.start();
    else if (!this.background) {
      this.run.drop();
      this.sync();
    }
  }
  pause() {
    this.run.pause();
    this.sync();
  }
  resume() {
    if (!this.background) {
      this.run.resume();
      this.sync();
    }
  }
  request(action: RunAction) {
    this.run.request(action);
    this.sync();
  }
  confirm(accepted: boolean) {
    this.run.confirm(accepted);
    if (this.background) this.run.pause();
    this.sync();
  }
  home() {
    this.run.home();
    this.sync();
  }
  update(deltaMs: number) {
    if (this.background) this.run.pause();
    const event = this.run.update(deltaMs);
    if (event === 'landed') this.app.audio?.sfx(assetKeys.stack);
    if (event === 'finished') {
      this.app.save.update((data) => ({
        best: Math.max(data.best, this.run.score),
        rounds: data.rounds + 1,
      }));
      this.saved = this.app.save.flush();
    }
    this.sync();
  }
}
