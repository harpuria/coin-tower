import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { gameConfig } from '../../src/config/game';
import { progressSchema, type Progress } from '../../src/game/save';
import { rules } from '../../src/game/rules';
import { crazyGamesSdkUrl } from '../../src/services/crazygames';

declare global {
  interface Window {
    __QUALITY_EVENTS__?: string[];
  }
}
const saveKey = `${gameConfig.storagePrefix}:save`;
const preview = process.env.E2E_PREVIEW === '1';
const saved = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), saveKey);
async function activate(page: Page, info: TestInfo, selector: string) {
  if (info.project.name === 'mobile') await page.locator(selector).tap();
  else await page.locator(selector).click();
}
const tap = (page: Page, info: TestInfo) =>
  activate(page, info, '#game canvas');
async function seed(
  page: Page,
  data: Partial<Progress>,
  legacy = false,
  unavailable = false,
) {
  const progress = { ...progressSchema.defaults(), ...data };
  const source: Record<string, unknown> = { ...progress };
  if (legacy) delete source.onboardingComplete;
  const raw = JSON.stringify({ version: legacy ? 4 : 5, data: source });
  await page.addInitScript(
    ({ key, raw, unavailable }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
      if (unavailable)
        Storage.prototype.setItem = () => {
          throw new DOMException('full', 'QuotaExceededError');
        };
    },
    { key: saveKey, raw, unavailable },
  );
  return raw;
}
async function ready(page: Page, debug = false) {
  await page.goto(debug ? '/?debug' : '/');
  await expect(page.locator('#play')).toBeEnabled();
  if (debug) await page.evaluate(() => window.__COIN_TOWER__!.freeze(true));
}
async function clockReady(page: Page, info: TestInfo) {
  await ready(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await activate(page, info, '#play');
}
async function finishLanding(page: Page) {
  for (let frame = 0; frame < 80; frame++) {
    if (
      (await page.locator('#surface').getAttribute('data-phase')) === 'moving'
    )
      return;
    await page.clock.runFor(16);
  }
  throw new Error('Landing did not return to movement');
}
async function aligned(page: Page, info: TestInfo, score: number) {
  await page.clock.runFor((232 / Math.min(350 + score * 15, 650)) * 1000);
  await tap(page, info);
  await finishLanding(page);
  await expect(page.locator('#score')).toHaveText(String(score + 1));
}
async function miss(page: Page, info: TestInfo) {
  await tap(page, info);
  await page.clock.runFor(320);
  await expect(page.locator('#surface')).toHaveAttribute('data-mode', 'result');
  await expect(page.locator('#result-screen')).toBeHidden();
  await page.clock.runFor(500);
  await expect(page.locator('#result-screen')).toBeVisible();
}

/** 같은 실제 입력 흐름을 standalone과 SDK fixture의 개발·배포본에서 검증한다. */
export function qualityCases(crazygames = false) {
  test.beforeEach(async ({ page }) => {
    if (crazygames)
      await page.route(crazyGamesSdkUrl, (route) =>
        route.fulfill({
          contentType: 'application/javascript',
          body: `window.__QUALITY_EVENTS__=[]; window.CrazyGames={SDK:{init:async()=>window.__QUALITY_EVENTS__.push('init'),environment:'local',game:{settings:{muteAudio:false},gameplayStart:()=>window.__QUALITY_EVENTS__.push('start'),gameplayStop:()=>window.__QUALITY_EVENTS__.push('stop'),addSettingsChangeListener:()=>{},removeSettingsChangeListener:()=>{}}}};`,
        }),
      );
  });

  test('quality: five real drops complete hints without finalizing the run', async ({
    page,
  }, info) => {
    test.setTimeout(90_000);
    await seed(
      page,
      {
        best: 30,
        bestCombo: 9,
        rounds: 12,
        shards: 17,
        ownedSkins: ['gold', 'ruby'],
        equippedSkin: 'ruby',
      },
      true,
    );
    await clockReady(page, info);
    await expect(page.locator('#tap-prompt')).toBeVisible();
    await expect(page.locator('#hud-best-combo')).toHaveCount(0);
    await expect(page.locator('#hud-shards')).toHaveCount(0);
    for (let i = 0; i < 5; i++) await aligned(page, info, i);
    await expect(page.locator('#tap-prompt')).toBeHidden();
    expect(await saved(page)).toEqual({
      version: 5,
      data: {
        ...progressSchema.defaults(),
        best: 30,
        bestCombo: 9,
        rounds: 12,
        shards: 17,
        ownedSkins: ['gold', 'ruby'],
        equippedSkin: 'ruby',
        onboardingComplete: true,
      },
    });
    await activate(page, info, '#pause');
    await activate(page, info, '#pause-home');
    await activate(page, info, '#confirm-yes');
    await page.clock.resume();
    await page.reload();
    await expect(page.locator('#play')).toBeEnabled();
    await activate(page, info, '#play');
    await expect(page.locator('#tap-prompt')).toBeHidden();
    expect((await saved(page)).data.rounds).toBe(12);
    if (preview)
      expect(await page.evaluate(() => window.__COIN_TOWER__)).toBeUndefined();
  });

  test('quality: result delay settles once, goals lead to purchase and the same result', async ({
    page,
  }, info) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await seed(page, { shards: 49 });
    await clockReady(page, info);
    await aligned(page, info, 0);
    await tap(page, info);
    await page.clock.runFor(320);
    await expect(page.locator('#result-screen')).toBeHidden();
    expect((await saved(page)).data).toMatchObject({
      rounds: 1,
      shards: 50,
      best: 1,
    });
    await page.clock.runFor(500);
    await expect(page.locator('#height-goal')).toHaveText('5 COINS');
    await expect(page.locator('#result-shop')).toBeVisible();
    await page.screenshot({
      path: info.outputPath('quality-result-ready.png'),
      fullPage: true,
    });
    const eventsBefore = crazygames
      ? await page.evaluate(() => window.__QUALITY_EVENTS__)
      : [];
    await activate(page, info, '#result-shop');
    await activate(page, info, '#skin-silver');
    await activate(page, info, '#skin-confirm-yes');
    await expect(page.locator('#skin-silver')).toHaveText('EQUIPPED');
    await activate(page, info, '#skins-back');
    await expect(page.locator('#result-screen')).toBeVisible();
    await expect(page.locator('#retry')).toBeFocused();
    await expect(page.locator('#result-shards-earned')).toHaveText('+1');
    await expect(page.locator('#result-shards-total')).toHaveText('0');
    await expect(page.locator('#goal-skin-name')).toHaveText('RUBY COIN');
    await expect(page.locator('#goal-skin-progress')).toContainText('150');
    await expect(page.locator('#result-shop')).toBeHidden();
    expect((await saved(page)).data).toMatchObject({
      rounds: 1,
      shards: 0,
      equippedSkin: 'silver',
    });
    if (crazygames)
      expect(await page.evaluate(() => window.__QUALITY_EVENTS__)).toEqual(
        eventsBefore,
      );
    await page.keyboard.press('Space');
    await expect(page.locator('#score')).toHaveText('0');
    expect(errors).toEqual([]);
  });

  for (const state of ['complete', 'unavailable'] as const)
    test(`quality: ${state} collection state and hint skip`, async ({
      page,
    }, info) => {
      const raw = await seed(
        page,
        state === 'complete'
          ? {
              ownedSkins: ['gold', 'silver', 'ruby', 'emerald'],
              onboardingComplete: true,
            }
          : { shards: 100 },
        false,
        state === 'unavailable',
      );
      await page.setViewportSize({ width: 821, height: 462 });
      await clockReady(page, info);
      if (state === 'unavailable') {
        await activate(page, info, '#skip-hints');
        await expect(page.locator('#score')).toHaveText('0');
        await expect(page.locator('#surface')).toHaveAttribute(
          'data-phase',
          'moving',
        );
      }
      await aligned(page, info, 0);
      await miss(page, info);
      await expect(page.locator('#result-shop')).toBeHidden();
      await page.screenshot({
        path: info.outputPath(`quality-${state}-result-821.png`),
        fullPage: true,
      });
      if (state === 'complete')
        await expect(page.locator('#goal-skin-name')).toHaveText(
          'COLLECTION COMPLETE',
        );
      else {
        await expect(page.locator('#goal-skin-progress')).toContainText(
          'unavailable',
        );
        expect(
          await page.evaluate((key) => localStorage.getItem(key), saveKey),
        ).toBe(raw);
        await activate(page, info, '#retry');
        await expect(page.locator('#tap-prompt')).toBeHidden();
      }
      await page.screenshot({
        path: info.outputPath(`quality-${state}-821.png`),
        fullPage: true,
      });
    });

  test('quality: 20-coin presentation, miss directions and small-frame readability', async ({
    page,
  }, info) => {
    test.skip(preview, 'development time control is excluded from production');
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await seed(page, { shards: 49 });
    await ready(page, true);
    await activate(page, info, '#play');
    const advance = (ms: number) =>
      page.evaluate((ms) => window.__COIN_TOWER__!.advance(ms), ms);
    const snapshot = () =>
      page.evaluate(() => window.__COIN_TOWER__!.snapshot());
    async function place(offset = 0) {
      const run = await snapshot();
      await advance(
        (Math.abs(run.activeX - run.targetX - offset) / run.speed) * 1000,
      );
      await tap(page, info);
      await advance(1000);
      if ((await snapshot()).mode === 'playing') await advance(rules.settleMs);
    }
    await expect(page.locator('#tap-prompt')).toBeVisible();
    await page.screenshot({
      path: info.outputPath('quality-hints.png'),
      fullPage: true,
    });
    for (let i = 0; i < 20; i++) {
      await place(i === 2 ? 35 : 0);
      if ([4, 9, 19].includes(i))
        await page.screenshot({
          path: info.outputPath(`quality-coins-${i + 1}.png`),
          fullPage: true,
        });
    }
    await place(-100);
    expect((await snapshot()).failureDirection).toBe(-1);
    expect((await saved(page)).data.rounds).toBe(1);
    await expect(page.locator('#result-screen')).toBeHidden();
    await advance(200);
    await page.screenshot({
      path: info.outputPath('quality-miss-left.png'),
      fullPage: true,
    });
    await advance(200);
    await expect(page.locator('#result-screen')).toBeVisible();
    await expect(page.locator('#height-goal')).toHaveText('30 COINS');
    for (const viewport of [
      { width: 821, height: 462 },
      { width: 907, height: 510 },
      { width: 360, height: 640 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      for (const selector of ['#retry', '#home', '#result-shop', '#mute']) {
        const box = (await page.locator(selector).boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      const sections = [
        '.result-heading',
        '.result-stats',
        '.result-caption',
        '.shard-reward',
        '.skin-goal',
        '.result-actions',
      ];
      const bounds = await Promise.all(
        sections.map((sel) => page.locator(sel).boundingBox()),
      );
      for (let i = 1; i < bounds.length; i++)
        expect(bounds[i]!.y).toBeGreaterThanOrEqual(
          bounds[i - 1]!.y + bounds[i - 1]!.height - 1,
        );
      const actions = bounds.at(-1)!;
      const utility = (await page.locator('.utility').boundingBox())!;
      expect(actions.y + actions.height).toBeLessThanOrEqual(utility.y);
      expect(
        await page
          .locator('.result-caption')
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(14);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`quality-result-${viewport.width}.png`),
        fullPage: true,
      });
    }
    await activate(page, info, '#result-shop');
    await activate(page, info, '#skin-silver');
    await activate(page, info, '#skin-confirm-yes');
    await activate(page, info, '#skins-back');
    await expect(page.locator('#retry')).toBeFocused();
    await advance(0);
    expect(
      await page.evaluate(
        () => window.__COIN_TOWER__!.feedback().coin?.texture,
      ),
    ).toBe('coin');
    await page.screenshot({
      path: info.outputPath('quality-purchase-completed-tower.png'),
      fullPage: true,
    });
    await activate(page, info, '#retry');
    await place();
    expect(
      await page.evaluate(
        () => window.__COIN_TOWER__!.feedback().coin?.texture,
      ),
    ).toBe('coinSilver');
    await place(100);
    expect((await snapshot()).failureDirection).toBe(1);
    await advance(200);
    await page.screenshot({
      path: info.outputPath('quality-miss-right.png'),
      fullPage: true,
    });
    await advance(200);
    await activate(page, info, '#home');
    // 실제 OS 설정을 새 페이지의 기본 설정으로 전달한다.
    await page.evaluate(
      (key) => localStorage.removeItem(key),
      `${gameConfig.storagePrefix}:settings`,
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page, true);
    await activate(page, info, '#play');
    await place();
    await place(100);
    await expect(page.locator('#miss-feedback')).toHaveText('MISS');
    await expect(page.locator('#miss-feedback')).toBeVisible();
    await advance(400);
    await expect(page.locator('#result-screen')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
