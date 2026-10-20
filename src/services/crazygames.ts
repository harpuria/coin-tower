export const crazyGamesSdkUrl =
  'https://sdk.crazygames.com/crazygames-sdk-v3.js';

export interface CrazyGamesSettings {
  muteAudio?: boolean;
}

/** HTML5 SDK v3에서 이 게임이 사용하는 계약만 선언한다. */
export interface CrazyGamesSdk {
  init(): Promise<void>;
  readonly environment: 'local' | 'crazygames' | 'disabled';
  game: {
    readonly settings: CrazyGamesSettings;
    gameplayStart(): void;
    gameplayStop(): void;
    loadingStart(): void;
    loadingStop(): void;
    happytime(): void;
    addSettingsChangeListener(
      listener: (settings: CrazyGamesSettings) => void,
    ): void;
    removeSettingsChangeListener(
      listener: (settings: CrazyGamesSettings) => void,
    ): void;
  };
}

declare global {
  interface Window {
    CrazyGames?: { SDK: CrazyGamesSdk };
  }
}

/** SDK가 실패해도 준비 완료로 가장하지 않는다. 재시도는 페이지 새로고침으로 한다. */
export class CrazyGamesIntegration {
  private sdk?: CrazyGamesSdk;
  private pending?: Promise<void>;
  private abort = new AbortController();
  private disposed = false;
  muted = false;
  environment: 'local' | 'crazygames' | 'disabled' | 'unavailable' =
    'unavailable';
  onMute: (muted: boolean) => void = () => {};
  private settingsChanged = (settings: CrazyGamesSettings) => {
    if (this.disposed) return;
    this.muted = settings.muteAudio === true;
    this.onMute(this.muted);
  };

  initialize(timeoutMs = 10_000): Promise<void> {
    this.pending ??= this.connect(timeoutMs);
    return this.pending;
  }

  private async connect(timeoutMs: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let script: HTMLScriptElement | undefined;
    const signal = this.abort.signal;
    const connect = async () => {
      if (signal.aborted) throw new Error('SDK initialization cancelled');
      if (!window.CrazyGames?.SDK) {
        await new Promise<void>((resolve, reject) => {
          script = document.createElement('script');
          script.src = crazyGamesSdkUrl;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('SDK download failed'));
          document.head.append(script);
        });
      }
      if (signal.aborted) throw new Error('SDK initialization cancelled');
      const sdk = window.CrazyGames?.SDK;
      if (!sdk) throw new Error('SDK is missing');
      await sdk.init();
      if (signal.aborted) throw new Error('SDK initialization cancelled');
      this.environment = sdk.environment;
      if (sdk.environment === 'disabled')
        throw new Error('SDK is disabled on this host');
      this.sdk = sdk;
      sdk.game.addSettingsChangeListener(this.settingsChanged);
      this.settingsChanged(sdk.game.settings);
    };
    const interrupted = new Promise<never>((_resolve, reject) => {
      signal.addEventListener(
        'abort',
        () => reject(new Error('SDK initialization cancelled')),
        { once: true },
      );
      timer = setTimeout(() => this.abort.abort(), timeoutMs);
    });
    try {
      await Promise.race([connect(), interrupted]);
    } catch (error) {
      this.abort.abort();
      this.removeListener();
      throw error;
    } finally {
      clearTimeout(timer);
      if (script) {
        script.onload = script.onerror = null;
        script.remove();
      }
    }
  }

  gameplayStart() {
    this.report('gameplayStart');
  }
  gameplayStop() {
    this.report('gameplayStop');
  }
  loadingStart() {
    this.report('loadingStart');
  }
  loadingStop() {
    this.report('loadingStop');
  }
  happytime() {
    this.report('happytime');
  }
  private report(
    event:
      | 'gameplayStart'
      | 'gameplayStop'
      | 'loadingStart'
      | 'loadingStop'
      | 'happytime',
  ) {
    if (!this.sdk || this.disposed) return;
    // 플랫폼 통신 실패가 이미 진행 중인 판을 중단하지 않도록 경계에서 처리한다.
    try {
      this.sdk.game[event]();
    } catch (error) {
      console.warn(`[CrazyGames] ${event} failed`, error);
    }
  }
  private removeListener() {
    this.sdk?.game.removeSettingsChangeListener(this.settingsChanged);
    this.sdk = undefined;
  }
  destroy() {
    this.disposed = true;
    this.abort.abort();
    this.removeListener();
    this.onMute = () => {};
  }
}
