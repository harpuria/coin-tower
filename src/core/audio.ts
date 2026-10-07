import Phaser from 'phaser';
import type { Settings } from './settings';

/** 음량 설정과 일시정지를 Phaser sound manager에 적용한다. asset 키는 게임이 넘긴다. */
export class AudioService {
  private music?: Phaser.Sound.BaseSound;
  private musicKey?: string;
  private suspended = false;
  constructor(
    private sound: Phaser.Sound.BaseSoundManager,
    private settings: Readonly<Settings>,
  ) {
    this.apply(settings);
  }

  apply(settings: Readonly<Settings>) {
    this.settings = settings;
    this.sound.mute = settings.muted || this.suspended;
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
  sfx(key: string) {
    if (!this.suspended && this.sound.game.cache.audio.has(key))
      this.sound.play(key, { volume: this.settings.sfx });
  }
  suspend(value: boolean) {
    this.suspended = value;
    this.apply(this.settings);
    if (value) this.music?.pause();
    else if (this.music?.isPaused) this.music.resume();
    else if (this.music && !this.music.isPlaying) this.music.play();
  }
  destroy() {
    this.stopMusic();
  }
}
