import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { crazyGamesSdkUrl } from '../../src/services/crazygames';

declare global {
  interface Window {
    __CG_AUDIO_GAINS__: GainNode[];
    __CG_TEST__: {
      events: string[];
      finish(): void;
      setMute(value: boolean): void;
    };
  }
}

async function fixture(
  page: Page,
  options: {
    delayed?: boolean;
    muted?: boolean;
    reject?: boolean;
    disabled?: boolean;
  } = {},
) {
  await page.route(crazyGamesSdkUrl, (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `(() => {
      const options = ${JSON.stringify(options)};
      let initialized = false;
      const listeners = new Set();
      const settings = { muteAudio: !!options.muted };
      const events = [];
      let finish = () => {};
      const requireReady = () => { if (!initialized) throw new Error('SDK used before init'); };
      window.__CG_TEST__ = {
        events,
        finish: () => finish(),
        setMute: (value) => { settings.muteAudio = value; for (const listener of listeners) listener({ ...settings }); },
      };
      window.CrazyGames = { SDK: {
        init: async () => {
          events.push('init');
          if (options.reject) throw new Error('initialization fixture');
          if (options.delayed) await new Promise((resolve) => { finish = resolve; });
          initialized = true;
        },
        get environment() { requireReady(); return options.disabled ? 'disabled' : 'local'; },
        game: {
          get settings() { requireReady(); return settings; },
          gameplayStart: () => { requireReady(); events.push('start'); },
          gameplayStop: () => { requireReady(); events.push('stop'); },
          addSettingsChangeListener: (listener) => { requireReady(); listeners.add(listener); },
          removeSettingsChangeListener: (listener) => listeners.delete(listener),
        },
      } };
    })();`,
    }),
  );
}

const events = (page: Page) => page.evaluate(() => window.__CG_TEST__.events);
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('#play')).toBeEnabled();
  await expect(page.locator('#loading-overlay')).toBeHidden();
}
async function tap(page: Page, info: TestInfo) {
  if (info.project.name === 'mobile') await page.locator('#game canvas').tap();
  else await page.locator('#game canvas').click();
}

test('awaits v3 initialization, keeps English UI and hides custom fullscreen', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await fixture(page, { delayed: true });
  await page.goto('/?debug');
  await expect.poll(() => events(page)).toEqual(['init']);
  await expect(page.locator('#play')).toBeDisabled();
  await expect(page.locator('#loading-overlay')).toBeVisible();
  await expect(page.locator('#game canvas')).toHaveCount(0);
  await expect(page.locator('#fullscreen')).toBeHidden();
  await page.evaluate(() => window.__CG_TEST__.finish());
  await expect(page.locator('#play')).toBeEnabled();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#play')).toHaveAccessibleName('Tap to play');
  await expect(page.locator('#app')).not.toContainText(/[가-힣]/);
  if (process.env.E2E_PREVIEW === '1') {
    expect(await page.evaluate(() => window.__COIN_TOWER__)).toBeUndefined();
  }
  await expect(page.locator('#game')).toHaveAttribute(
    'aria-label',
    'Game area. Click, tap or press Space to drop a coin.',
  );
  expect(await events(page)).toEqual(['init']);
  await page.screenshot({
    path: info.outputPath('english-title.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test('reports play, manual pause, countdown completion, failure, retry and menu exactly once', async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await fixture(page);
  await ready(page);
  await page.locator('#play').click();
  expect(await events(page)).toEqual(['init', 'start']);
  await page.locator('#pause').click();
  await page.locator('#restart').click();
  await page.locator('#confirm-no').click();
  expect(await events(page)).toEqual(['init', 'start', 'stop']);
  await page.locator('#continue').click();
  await expect(page.locator('#countdown')).toHaveText('3');
  expect(await events(page)).toEqual(['init', 'start', 'stop']);
  await expect(page.locator('#countdown-overlay')).toBeHidden({
    timeout: 10000,
  });
  expect(await events(page)).toEqual(['init', 'start', 'stop', 'start']);
  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
  });
  await expect(page.locator('#pause-overlay')).toBeVisible();
  expect(await events(page)).toEqual(['init', 'start', 'stop', 'start']);
  await page.locator('#continue').click();
  await expect(page.locator('#countdown-overlay')).toBeHidden({
    timeout: 10000,
  });
  expect(await events(page)).toEqual([
    'init',
    'start',
    'stop',
    'start',
    'start',
  ]);
  // 확인된 재시작부터 실제 포인터 입력으로 성공 1개와 첫 실패를 만든다.
  await page.locator('#pause').click();
  await page.locator('#restart').click();
  // 배포용 게임 코드에 관측 API를 추가하지 않고 브라우저 시간만 고정한다.
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.locator('#confirm-yes').click();
  expect((await events(page)).slice(-2)).toEqual(['stop', 'start']);
  await tap(page, info);
  await page.clock.runFor(320);
  await expect(page.locator('#score')).toHaveText('1');
  await page.clock.runFor(300);
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await tap(page, info);
  await page.clock.runFor(720);
  await expect(page.locator('#result-screen')).toBeVisible();
  expect((await events(page)).at(-1)).toBe('stop');
  const beforeRetry = await events(page);
  await page.locator('#retry').click();
  expect(await events(page)).toEqual([...beforeRetry, 'start']);
  await page.locator('#pause').click();
  await page.locator('#pause-home').click();
  await page.locator('#confirm-yes').click();
  await expect(page.locator('#play')).toBeVisible();
  expect(await events(page)).toEqual([...beforeRetry, 'start', 'stop']);
  expect(errors).toEqual([]);
});

test('platform mute takes priority and preserves stored user mute across changes and reload', async ({
  page,
}) => {
  // Phaser 4의 첫 GainNode는 masterMuteNode다. 실제 오디오 경로를 관측한다.
  await page.addInitScript(() => {
    window.__CG_AUDIO_GAINS__ = [];
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const node = createGain.call(this);
      window.__CG_AUDIO_GAINS__.push(node);
      return node;
    };
  });
  const audioGain = () =>
    page.evaluate(() => window.__CG_AUDIO_GAINS__[0]?.gain.value);
  await fixture(page, { muted: true });
  await ready(page);
  const mute = page.locator('#mute');
  await expect(mute).toBeDisabled();
  await expect(mute).toHaveAttribute('aria-label', 'Sound muted by platform');
  await expect(mute).toHaveAttribute('aria-pressed', 'true');
  // 오디오 렌더가 시작된 뒤 실제 gain 값을 읽는다(자동 재생 제한).
  await page.locator('#play').click();
  await expect.poll(audioGain).toBe(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('coin-tower-web-v1:settings'),
    ),
  ).toBeNull();
  await page.evaluate(() => window.__CG_TEST__.setMute(false));
  await expect(mute).toBeEnabled();
  await expect(mute).toHaveAttribute('aria-label', 'Mute sound');
  await expect.poll(audioGain).toBe(1);
  await mute.click();
  await expect.poll(audioGain).toBe(0);
  const saved = await page.evaluate(() =>
    localStorage.getItem('coin-tower-web-v1:settings'),
  );
  expect(JSON.parse(saved!).data.muted).toBe(true);
  await page.evaluate(() => {
    window.__CG_TEST__.setMute(true);
    window.__CG_TEST__.setMute(false);
  });
  await expect(mute).toHaveAttribute('aria-label', 'Unmute sound');
  await expect.poll(audioGain).toBe(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('coin-tower-web-v1:settings'),
    ),
  ).toBe(saved);
  await page.reload();
  await expect(page.locator('#play')).toBeEnabled();
  await expect(mute).toBeDisabled();
  await page.locator('#play').click();
  await expect.poll(audioGain).toBe(0);
  await page.evaluate(() => window.__CG_TEST__.setMute(false));
  await expect(mute).toHaveAttribute('aria-label', 'Unmute sound');
  await expect.poll(audioGain).toBe(0);
});

for (const failure of ['download', 'init', 'disabled'] as const) {
  test(`${failure} failure keeps gameplay unavailable and offers English reload`, async ({
    page,
  }) => {
    if (failure === 'download')
      await page.route(crazyGamesSdkUrl, (route) => route.abort());
    else
      await fixture(page, {
        reject: failure === 'init',
        disabled: failure === 'disabled',
      });
    await page.goto('/');
    await expect(page.locator('#error-overlay')).toContainText(
      'Unable to connect. Please reload to try again.',
    );
    await expect(page.locator('#reload')).toHaveText('RELOAD');
    await expect(page.locator('#play')).toBeDisabled();
    await expect(page.locator('#fullscreen')).toBeHidden();
    await expect(page.locator('#game canvas')).toHaveCount(0);
    if (failure !== 'download') expect(await events(page)).toEqual(['init']);
    await page.unrouteAll();
    await fixture(page);
    await page.locator('#reload').click();
    await expect(page.locator('#play')).toBeEnabled();
  });
}

test('English controls fit a small portal viewport without showing custom fullscreen', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 821, height: 462 });
  await fixture(page);
  await ready(page);
  await page.screenshot({
    path: info.outputPath('portal-title.png'),
    fullPage: true,
  });
  await page.locator('#play').click();
  await page.locator('#pause').click();
  await expect(page.locator('#continue')).toHaveText('CONTINUE');
  await page.screenshot({
    path: info.outputPath('portal-pause.png'),
    fullPage: true,
  });
  await page.locator('#restart').click();
  await expect(page.locator('#confirm-title')).toHaveText('Start a new run?');
  await page.screenshot({
    path: info.outputPath('portal-confirm.png'),
    fullPage: true,
  });
  const layout = await page
    .locator('#confirm-overlay button, #pause-overlay button, #mute')
    .evaluateAll((elements) =>
      elements.map((element) => ({
        width: element.clientWidth,
        content: element.scrollWidth,
      })),
    );
  expect(layout.every(({ width, content }) => content <= width)).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator('#fullscreen')).toBeHidden();
});

test('official CDN SDK initializes in its real local environment', async ({
  page,
}, info) => {
  const sdkFile = process.env.CG_SDK_FILE;
  test.skip(
    !sdkFile,
    'Set CG_SDK_FILE to an unmodified download of the official v3 CDN script',
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(crazyGamesSdkUrl, (route) =>
    route.fulfill({ path: sdkFile!, contentType: 'application/javascript' }),
  );
  await ready(page);
  expect(await page.evaluate(() => window.CrazyGames!.SDK.environment)).toBe(
    'local',
  );
  await expect(page.locator('#fullscreen')).toBeHidden();
  await page.locator('#play').click();
  await page.locator('#pause').click();
  await page.locator('#continue').click();
  await expect(page.locator('#countdown-overlay')).toBeHidden({
    timeout: 10000,
  });
  await page.screenshot({
    path: info.outputPath('official-sdk-local.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
