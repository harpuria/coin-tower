import { cameraZoom, landingKind, moveSpeed, rules } from './rules';
import { failureRules } from './feedback';
import {
  backgroundAt,
  backgroundRules,
  type BackgroundTime,
} from './backgrounds';

export type Mode = 'menu' | 'playing' | 'result';
export type Phase = 'moving' | 'dropping' | 'settling';
export type RunAction = 'restart' | 'home';
export interface Coin {
  x: number;
  y: number;
}

/** 화면과 브라우저에 의존하지 않는 한 판의 상태. 저장에는 완료한 최고 기록만 전달한다. */
export class Session {
  mode: Mode = 'menu';
  phase: Phase = 'moving';
  coins: Coin[] = [];
  activeX = rules.width / 2 - rules.laneHalfWidth;
  activeY = 0;
  direction = 1;
  speed = rules.baseSpeed as number;
  cameraOffset = 0;
  zoom = 1;
  streak = 0;
  maxCombo = 0;
  feedback: 'nice' | 'perfect' | null = null;
  feedbackRemaining = 0;
  failureRemaining = 0;
  failureDirection = 1;
  paused = false;
  countdownMs = 0;
  confirmation: RunAction | null = null;
  private settleRemaining = 0;
  private cameraStart = 0;
  private cameraEnd = 0;
  private zoomStart = 1;
  private zoomEnd = 1;
  private backgroundFrom: BackgroundTime = 'morning';
  private backgroundTo: BackgroundTime = 'morning';
  private backgroundElapsedMs: number = backgroundRules.fadeMs;

  constructor() {
    this.reset('menu');
  }
  get score() {
    return this.coins.length;
  }
  get combo() {
    return this.streak;
  }
  get targetX() {
    return this.coins.at(-1)?.x ?? rules.width / 2;
  }
  get targetY() {
    return rules.platformY - rules.coinHeight * (this.score + 0.5);
  }
  get frozen() {
    return this.paused || this.countdownMs > 0;
  }
  get resultReady() {
    return this.mode === 'result' && this.failureRemaining === 0;
  }
  get background() {
    return {
      from: this.backgroundFrom,
      to: this.backgroundTo,
      progress: this.backgroundElapsedMs / backgroundRules.fadeMs,
    };
  }

  start() {
    this.reset('playing');
  }
  home() {
    this.reset('menu');
  }

  private reset(mode: Mode) {
    this.mode = mode;
    this.coins = [];
    this.streak = 0;
    this.maxCombo = 0;
    this.feedback = null;
    this.feedbackRemaining = 0;
    this.failureRemaining = 0;
    this.failureDirection = 1;
    this.paused = false;
    this.countdownMs = 0;
    this.confirmation = null;
    this.settleRemaining = 0;
    this.backgroundFrom = this.backgroundTo = 'morning';
    this.backgroundElapsedMs = backgroundRules.fadeMs;
    this.cameraOffset = rules.height * rules.targetFraction - this.targetY;
    this.cameraStart = this.cameraEnd = this.cameraOffset;
    this.zoom = this.zoomStart = this.zoomEnd = 1;
    this.spawn();
  }

  private spawn() {
    this.phase = 'moving';
    this.direction = this.score % 2 === 0 ? 1 : -1;
    this.activeX = rules.width / 2 - this.direction * rules.laneHalfWidth;
    this.activeY = this.targetY - rules.spawnGap;
    this.speed = moveSpeed(this.score);
  }

  /** 누르는 입력 한 번만 받으며 낙하·정착·정지 중 입력은 예약하지 않는다. */
  drop() {
    if (this.mode !== 'playing' || this.phase !== 'moving' || this.frozen)
      return false;
    this.phase = 'dropping';
    return true;
  }
  pause() {
    if (this.mode !== 'playing') return;
    this.paused = true;
    this.countdownMs = 0;
  }
  resume() {
    if (!this.paused || this.confirmation) return;
    this.paused = false;
    this.countdownMs = rules.resumeMs;
  }
  request(action: RunAction) {
    if (this.mode !== 'playing' || !this.paused) return;
    this.confirmation = action;
  }
  confirm(accepted: boolean) {
    const action = this.confirmation;
    this.confirmation = null;
    if (!accepted || !action) return;
    if (action === 'restart') this.start();
    else this.home();
  }

  /** 게임 시간만 진행한다. 다음 단계에 남은 시간을 넘겨 중복 착지를 만들지 않는다. */
  update(deltaMs: number): 'landed' | 'finished' | undefined {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    if (this.mode === 'result') {
      this.failureRemaining = Math.max(0, this.failureRemaining - deltaMs);
      return;
    }
    if (this.mode !== 'playing' || this.paused) return;
    if (this.countdownMs > 0) {
      this.countdownMs = Math.max(0, this.countdownMs - deltaMs);
      return;
    }
    this.feedbackRemaining = Math.max(0, this.feedbackRemaining - deltaMs);
    this.backgroundElapsedMs = Math.min(
      backgroundRules.fadeMs,
      this.backgroundElapsedMs + deltaMs,
    );
    if (this.backgroundElapsedMs === backgroundRules.fadeMs)
      this.backgroundFrom = this.backgroundTo;
    if (this.phase === 'moving') {
      const left = rules.width / 2 - rules.laneHalfWidth;
      const span = rules.laneHalfWidth * 2;
      // 삼각파로 경계를 반사해 큰 시간 간격에서도 이동 범위를 유지한다.
      const unfolded =
        this.direction > 0
          ? this.activeX - left
          : 2 * span - (this.activeX - left);
      const travel = (unfolded + (this.speed * deltaMs) / 1000) % (2 * span);
      this.activeX = left + (travel <= span ? travel : 2 * span - travel);
      this.direction = travel < span ? 1 : -1;
    } else if (this.phase === 'dropping') {
      this.activeY = Math.min(
        this.targetY,
        this.activeY + (rules.fallSpeed * deltaMs) / 1000,
      );
      if (this.activeY < this.targetY) return;
      const kind = landingKind(this.activeX, this.targetX, this.score === 0);
      if (kind === 'miss') {
        this.mode = 'result';
        this.streak = 0;
        this.feedback = null;
        this.feedbackRemaining = 0;
        this.failureRemaining = failureRules.durationMs;
        this.failureDirection = this.activeX < this.targetX ? -1 : 1;
        return 'finished';
      }
      this.coins.push({ x: this.activeX, y: this.targetY });
      const nextBackground = backgroundAt(this.score);
      if (nextBackground !== this.backgroundTo) {
        this.backgroundFrom = this.backgroundTo;
        this.backgroundTo = nextBackground;
        this.backgroundElapsedMs = 0;
      }
      this.streak = kind === 'perfect' ? this.streak + 1 : 0;
      this.maxCombo = Math.max(this.maxCombo, this.streak);
      this.feedback = kind;
      this.feedbackRemaining = rules.feedbackMs;
      this.phase = 'settling';
      this.settleRemaining = rules.settleMs;
      this.zoomStart = this.zoom;
      this.zoomEnd = cameraZoom(this.score);
      this.cameraStart = this.cameraOffset;
      this.cameraEnd = rules.height * rules.targetFraction - this.targetY;
      return 'landed';
    } else {
      this.settleRemaining = Math.max(0, this.settleRemaining - deltaMs);
      const t = 1 - this.settleRemaining / rules.settleMs;
      const eased = t * t * (3 - 2 * t);
      this.cameraOffset =
        this.cameraStart + (this.cameraEnd - this.cameraStart) * eased;
      this.zoom = this.zoomStart + (this.zoomEnd - this.zoomStart) * eased;
      if (this.settleRemaining === 0) this.spawn();
    }
  }

  snapshot() {
    return {
      mode: this.mode,
      phase: this.phase,
      score: this.score,
      background: this.background,
      activeX: this.activeX,
      activeY: this.activeY,
      targetX: this.targetX,
      targetY: this.targetY,
      direction: this.direction,
      speed: this.speed,
      cameraOffset: this.cameraOffset,
      zoom: this.zoom,
      streak: this.streak,
      combo: this.combo,
      maxCombo: this.maxCombo,
      feedback: this.feedback,
      failureRemaining: this.failureRemaining,
      failureDirection: this.failureDirection,
      resultReady: this.resultReady,
      paused: this.paused,
      countdownMs: this.countdownMs,
      confirmation: this.confirmation,
    };
  }
}
