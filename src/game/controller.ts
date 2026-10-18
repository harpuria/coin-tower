import type { App } from '../app';
import { assetKeys } from './assets';
import { shardReward } from './economy';
import { feedbackRules } from './feedback';
import type { RunAction } from './session';
import { skinById, type SkinId } from './skins';

export interface RunResult {
  score: number;
  combo: number;
  best: number;
  bestCombo: number;
  newBest: boolean;
  newBestCombo: boolean;
  shardsEarned: number;
  shardsTotal: number;
}

/** 한 판의 행동을 공통 저장·오디오·수명 서비스에 연결한다. */
export class GameController {
  private viewKey = '';
  private gameplayActive = false;
  saved = true;
  skinsOpen = false;
  skinPurchase: SkinId | null = null;
  skinMessage = '';
  runSkin: SkinId;
  result: Readonly<RunResult> | null = null;
  constructor(readonly app: App) {
    this.runSkin = app.save.data.equippedSkin;
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
      this.run.resultReady,
      this.app.save.data.onboardingComplete,
    ].join(':');
    if (key !== this.viewKey) {
      this.viewKey = key;
      this.app.onState();
    }
  }
  start() {
    if (
      !this.app.ready ||
      this.skinsOpen ||
      (this.run.mode === 'result' && !this.run.resultReady)
    )
      return;
    this.result = null;
    this.runSkin = this.app.save.data.equippedSkin;
    this.run.start();
    if (this.background) this.run.pause();
    this.sync();
    this.app.audio?.playMusic(assetKeys.music);
  }
  tap() {
    if (this.skinsOpen) return;
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
    const restart = accepted && this.run.confirmation === 'restart';
    this.run.confirm(accepted);
    if (restart) this.runSkin = this.app.save.data.equippedSkin;
    if (this.background) this.run.pause();
    this.sync();
  }
  home() {
    this.skinsOpen = false;
    this.skinPurchase = null;
    this.result = null;
    this.run.home();
    this.sync();
  }
  update(deltaMs: number) {
    if (this.background) this.run.pause();
    if (this.background && this.run.mode === 'result') return;
    const event = this.run.update(deltaMs);
    if (event === 'landed') {
      const feedback = feedbackRules[this.run.feedback!];
      this.app.audio?.sfx(assetKeys.stack, {
        rate: feedback.soundRate,
        gain: feedback.soundGain,
      });
      if (this.run.score >= 5) this.completeHints();
    }
    if (event === 'finished') {
      const previous = this.app.save.data;
      const reward = shardReward(this.run.score, previous.shards);
      // 갱신 전 개인 최고와 비교한 결과를 보존해 동점을 경신으로 표시하지 않는다.
      const result: RunResult = {
        score: this.run.score,
        combo: this.run.maxCombo,
        best: Math.max(previous.best, this.run.score),
        bestCombo: Math.max(previous.bestCombo, this.run.maxCombo),
        newBest: this.run.score > previous.best,
        newBestCombo: this.run.maxCombo > previous.bestCombo,
        shardsEarned: reward.earned,
        shardsTotal: reward.total,
      };
      this.result = result;
      this.app.save.update((data) => ({
        ...data,
        best: result.best,
        bestCombo: result.bestCombo,
        rounds: Math.min(Number.MAX_SAFE_INTEGER, data.rounds + 1),
        shards: result.shardsTotal,
      }));
      this.saved = this.app.save.flush();
    }
    this.sync();
  }

  get showHints() {
    return (
      this.run.mode === 'playing' &&
      this.run.phase === 'moving' &&
      !this.run.frozen &&
      !this.background &&
      !this.app.save.data.onboardingComplete
    );
  }
  private completeHints() {
    if (this.app.save.data.onboardingComplete) return;
    this.app.save.update((data) => ({ ...data, onboardingComplete: true }));
    this.saved = this.app.save.flush();
  }
  skipHints() {
    if (!this.showHints) return;
    this.completeHints();
    this.sync();
  }

  private get canUseShop() {
    return this.run.mode === 'menu' || this.run.resultReady;
  }

  openSkins() {
    if (!this.app.ready || this.app.fatalError || !this.canUseShop) return;
    this.skinsOpen = true;
    this.skinMessage = '';
    this.app.onState();
  }
  closeSkins() {
    this.skinsOpen = false;
    this.skinPurchase = null;
    this.skinMessage = '';
    this.app.onState();
  }
  selectSkin(id: SkinId) {
    if (!this.skinsOpen || this.skinPurchase || !this.canUseShop) return;
    const progress = this.app.save.data;
    this.skinMessage = '';
    if (progress.ownedSkins.includes(id)) {
      if (progress.equippedSkin === id) return;
      const saved = this.app.save.commit((data) => ({
        ...data,
        equippedSkin: id,
      }));
      this.skinMessage = saved
        ? `${skinById(id).name} equipped.`
        : 'Could not save. Your equipped skin has not changed.';
    } else if (this.app.save.status !== 'ready') {
      this.skinMessage =
        'Purchases are unavailable because progress cannot be saved.';
    } else if (progress.shards < skinById(id).price) {
      this.skinMessage = `Need ${skinById(id).price - progress.shards} more Star Shards.`;
    } else {
      this.skinPurchase = id;
    }
    this.app.onState();
  }
  confirmSkinPurchase(accepted: boolean) {
    if (!this.skinsOpen || !this.skinPurchase || !this.canUseShop) return;
    const id = this.skinPurchase;
    this.skinPurchase = null;
    if (accepted) {
      const skin = skinById(id);
      const progress = this.app.save.data;
      if (progress.ownedSkins.includes(id) || progress.shards < skin.price) {
        this.skinMessage = 'Purchase unavailable. Please choose a skin again.';
      } else {
        const saved = this.app.save.commit((data) => ({
          ...data,
          shards: data.shards - skin.price,
          ownedSkins: [...data.ownedSkins, id],
          equippedSkin: id,
        }));
        this.skinMessage = saved
          ? `${skin.name} unlocked and equipped!`
          : 'Purchase could not be saved. No Star Shards were spent.';
      }
    }
    this.app.onState();
  }
}
