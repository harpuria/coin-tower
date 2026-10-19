import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { moveSpeed } from '../../src/game/rules';
import { progressSchema } from '../../src/game/save';

declare global {
  interface Window {
    __LOAD_EVENTS__: string[];
  }
}

const optional =
  /\/(skins\/coin_(silver|ruby|emerald)|backgrounds\/sky_ruins_(noon|evening|night))\.webp$/;
const saveKey = 'coin-tower-web-v1:save';
async function activate(page: Page, info: TestInfo, selector: string) {
  if (info.project.name === 'mobile') await page.locator(selector).tap();
  else await page.locator(selector).click();
}
async function land(page: Page, info: TestInfo, score: number) {
  await page.clock.runFor((232 / moveSpeed(score)) * 1000);
  await activate(page, info, '#game canvas');
  for (let frame = 0; frame < 80; frame++) {
    await page.clock.runFor(16);
    if (
      (await page.locator('#surface').getAttribute('data-phase')) === 'moving'
    )
      break;
  }
  await expect(page.locator('#score')).toHaveText(String(score + 1));
}

/** 선택 자산의 지연/실패가 플레이와 소유권을 막거나 변경하지 않는 배포 계약. */
export function loadingCases(crazygames = false) {
  test.beforeEach(async ({ page }) => {
    if (crazygames)
      await page.addInitScript(() => {
        window.__LOAD_EVENTS__ = [];
        window.CrazyGames = {
          SDK: {
            init: async () => {},
            environment: 'local',
            game: {
              settings: { muteAudio: false },
              gameplayStart: () => {
                window.__LOAD_EVENTS__.push('start');
              },
              gameplayStop: () => {
                window.__LOAD_EVENTS__.push('stop');
              },
              addSettingsChangeListener() {},
              removeSettingsChangeListener() {},
            },
          },
        };
      });
  });

  test('loading: first play and a milestone work while later art waits, then the real art becomes usable', async ({
    page,
  }, info) => {
    test.setTimeout(150_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests: string[] = [];
    await page.route(optional, async (route) => {
      requests.push(route.request().url());
      await held;
      await route.continue();
    });
    await page.goto('/');
    await expect(page.locator('#play')).toBeEnabled();
    expect(requests).toEqual([]);
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await activate(page, info, '#play');
    if (crazygames)
      expect(await page.evaluate(() => window.__LOAD_EVENTS__)).toEqual([
        'start',
      ]);
    for (let score = 0; score < 10; score++) await land(page, info, score);
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    await expect(page.locator('#error-overlay')).toBeHidden();
    await expect(page.locator('#backdrop-base')).toHaveAttribute(
      'data-time',
      'background',
    );
    await expect(page.locator('#backdrop-next')).toBeHidden();
    await page.screenshot({
      path: info.outputPath('milestone-awaiting-art.png'),
    });
    release();
    // Phaser가 프레임마다 다음 요청을 꺼내므로 정지한 검사 시계도 진행한다.
    await expect
      .poll(
        async () => {
          await page.clock.runFor(16);
          return page.locator('#skin-emerald').textContent();
        },
        { timeout: 15000 },
      )
      .toBe('BUY 300');
    await expect
      .poll(
        async () => {
          await page.clock.runFor(16);
          return page.locator('#backdrop-next').getAttribute('data-time');
        },
        { timeout: 15000 },
      )
      .toBe('backgroundNoon');
    await page.clock.runFor(32);
    await expect(page.locator('#backdrop-next')).toBeVisible();
    await page.screenshot({ path: info.outputPath('milestone-art-ready.png') });
    await activate(page, info, '#game canvas');
    await page.clock.runFor(1000);
    await expect(page.locator('#result-screen')).toBeVisible();
    await activate(page, info, '#home');
    await activate(page, info, '#skins-menu');
    for (const skin of ['gold', 'silver', 'ruby', 'emerald']) {
      await expect
        .poll(() =>
          page
            .locator(`#skin-image-${skin}`)
            .evaluate((image) => (image as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
    }
    await activate(page, info, '#skins-back');
    await expect(page.locator('#play')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('loading: failed skin cannot be purchased, retry restores it, and equipped art gates the next load', async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ key, data }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify({ version: 5, data }));
      },
      { key: saveKey, data: { ...progressSchema.defaults(), shards: 500 } },
    );
    let fail = true;
    let silverRequests = 0;
    await page.route('**/skins/coin_silver.webp', async (route) => {
      silverRequests++;
      if (fail) await route.fulfill({ status: 503, body: 'temporary failure' });
      else await route.continue();
    });
    await page.goto('/');
    await expect(page.locator('#play')).toBeEnabled();
    expect(silverRequests).toBe(0);
    await activate(page, info, '#skins-menu');
    await expect(page.locator('#skin-silver')).toHaveText('UNAVAILABLE');
    await expect(page.locator('#skin-silver')).toBeDisabled();
    await expect(page.locator('#skins-retry')).toBeVisible();
    await expect(page.locator('#error-overlay')).toBeHidden();
    const saved = () =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).data,
        saveKey,
      );
    expect((await saved()).shards).toBe(500);
    expect((await saved()).ownedSkins).toEqual(['gold']);
    fail = false;
    await activate(page, info, '#skins-retry');
    await expect(page.locator('#skin-silver')).toBeEnabled();
    await activate(page, info, '#skin-silver');
    await activate(page, info, '#skin-confirm-yes');
    expect((await saved()).shards).toBe(450);
    expect((await saved()).equippedSkin).toBe('silver');
    await activate(page, info, '#skins-back');
    const beforeReload = silverRequests;
    await page.reload();
    await expect(page.locator('#play')).toBeEnabled();
    expect(silverRequests).toBeGreaterThan(beforeReload);
    await activate(page, info, '#play');
    await expect(page.locator('#surface')).toHaveAttribute(
      'data-mode',
      'playing',
    );
    expect((await saved()).equippedSkin).toBe('silver');
    expect(errors).toEqual([]);
  });
}
