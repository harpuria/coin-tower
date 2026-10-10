import Phaser from 'phaser';
import type { Settings } from './settings';

/** 음량 설정과 일시정지를 Phaser sound manager에 적용한다. asset 키는 게임이 넘긴다. */
export class AudioService {
  private music?: Phaser.Sound.BaseSound;
  private musicKey?: string;
  private effects = new Set<Phaser.Sound.BaseSound>();
  private suspended = false;
  private platformMuted = false;
  constructor(
    private sound: Phaser.Sound.BaseSoundManager,
    private settings: Readonly<Settings>,
  ) {
    this.apply(settings);
  }

  apply(settings: Readonly<Settings>) {
    this.settings = settings;
    this.sound.mute = settings.muted || this.suspended || this.platformMuted;
    this.sound.volume = settings.master;
    if (this.music && 'setVolume' in this.music) {
      (this.music as Phaser.Sound.WebAudioSound).setVolume(settings.music);
    }
  }
  /** 반복 재생할 배경음. 다른 키를 넘기면 이전 곡을 정리하고 바꾼다. */
  playMusic(key: string) {
    if (this.musicKey !== key) {
      this.music?.destroy();
      this.music = this.sound.add(key, {
        loop: true,
        volume: this.settings.music,
      });
      this.musicKey = key;
    }
    if (!this.suspended && !this.music!.isPlaying) this.music!.play();
  }
  stopMusic() {
    this.music?.destroy();
    this.music = this.musicKey = undefined;
  }
  sfx(key: string, options: { rate?: number; gain?: number } = {}) {
    if (this.suspended || !this.sound.game.cache.audio.has(key)) return;
    const effect = this.sound.add(key, {
      rate: options.rate ?? 1,
      volume: this.settings.sfx * (options.gain ?? 1),
    });
    this.effects.add(effect);
    const release = () => {
      this.effects.delete(effect);
      effect.destroy();
    };
    effect.once(Phaser.Sound.Events.COMPLETE, release);
    if (!effect.play()) release();
  }
  suspend(value: boolean) {
    this.suspended = value;
    this.apply(this.settings);
    if (value) {
      // 짧은 효과음은 정지 시 끝내 재개 카운트다운 뒤 조각이 다시 울리지 않게 한다.
      for (const effect of this.effects) effect.destroy();
      this.effects.clear();
      this.sound.pauseAll();
    } else {
      this.sound.resumeAll();
      if (this.music && !this.music.isPlaying) this.music.play();
    }
  }
  setPlatformMuted(value: boolean) {
    this.platformMuted = value;
    this.apply(this.settings);
  }
  destroy() {
    for (const effect of this.effects) effect.destroy();
    this.effects.clear();
    this.stopMusic();
  }
}
