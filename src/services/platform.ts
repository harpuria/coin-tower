import { CrazyGamesIntegration } from './crazygames';

export type ServiceResult =
  | { status: 'completed'; mock: true }
  | {
      status:
        'unavailable' | 'consent-required' | 'busy' | 'cancelled' | 'error';
    };

export interface PlatformAdapter {
  rewarded(): Promise<ServiceResult>;
  purchase(product: string): Promise<ServiceResult>;
  track(event: string): void;
}

export class UnavailableAdapter implements PlatformAdapter {
  async rewarded(): Promise<ServiceResult> {
    return { status: 'unavailable' };
  }
  async purchase(): Promise<ServiceResult> {
    return { status: 'unavailable' };
  }
  track() {}
}

export class MockAdapter implements PlatformAdapter {
  outcome: 'completed' | 'cancelled' | 'error' = 'completed';
  private async result(): Promise<ServiceResult> {
    const outcome = this.outcome;
    await new Promise((resolve) => setTimeout(resolve, 350));
    return outcome === 'completed'
      ? { status: outcome, mock: true }
      : { status: outcome };
  }
  rewarded() {
    return this.result();
  }
  purchase() {
    return this.result();
  }
  track(event: string) {
    console.info('[Mock analytics]', event);
  }
}

export class PlatformServices {
  private busy = false;
  consent = false;
  readonly adapter: PlatformAdapter;
  readonly isMock: boolean;
  private integration?: CrazyGamesIntegration;
  onMute: (muted: boolean) => void = () => {};
  get muted() {
    return this.integration?.muted ?? false;
  }
  get hideFullscreen() {
    return this.options.crazygames === true;
  }
  initialize() {
    return this.integration?.initialize() ?? Promise.resolve();
  }
  gameplayStart() {
    this.integration?.gameplayStart();
  }
  gameplayStop() {
    this.integration?.gameplayStop();
  }
  destroy() {
    this.integration?.destroy();
    this.onMute = () => {};
  }

  constructor(
    private options: {
      development: boolean;
      mock: boolean;
      ads: boolean;
      billing: boolean;
      analytics: boolean;
      crazygames?: boolean;
    },
  ) {
    this.isMock = options.development && options.mock;
    this.adapter = this.isMock ? new MockAdapter() : new UnavailableAdapter();
    if (options.crazygames) {
      this.integration = new CrazyGamesIntegration();
      this.integration.onMute = (muted) => this.onMute(muted);
    }
  }

  private async request(
    enabled: boolean,
    needsConsent: boolean,
    action: () => Promise<ServiceResult>,
  ): Promise<ServiceResult> {
    if (!enabled || !this.isMock) return { status: 'unavailable' };
    if (needsConsent && !this.consent) return { status: 'consent-required' };
    if (this.busy) return { status: 'busy' };
    this.busy = true;
    try {
      return await action();
    } catch {
      return { status: 'error' };
    } finally {
      this.busy = false;
    }
  }
  rewarded() {
    return this.request(this.options.ads, true, () => this.adapter.rewarded());
  }
  purchase(product: string) {
    return this.request(this.options.billing, false, () =>
      this.adapter.purchase(product),
    );
  }
  track(event: string): boolean {
    if (!this.options.analytics || !this.isMock || !this.consent) return false;
    this.adapter.track(event);
    return true;
  }
}
