import { writeFile } from 'node:fs/promises';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { gameConfig } from '../../src/config/game';
import { cameraZoom, moveSpeed, rules } from '../../src/game/rules';
import { crazyGamesSdkUrl } from '../../src/services/crazygames';

const preview = process.env.E2E_PREVIEW === '1';
async function activate(page: Page, info: TestInfo, selector: string) {
  if (info.project.name === 'mobile') await page.locator(selector).tap();
  else if (selector === '#game canvas') await page.keyboard.press('Space');
  else await page.locator(selector).click();
}

/** 시간과 실제 입력으로 높은 점수를 만들며 점수·좌표를 덮어쓰지 않는다. */
export function difficultyCases(crazygames = false) {
  // 긴 프레임 기록의 부하를 줄이고 구간별 캡처·JSON으로 관측을 보존한다.
  test.use({ trace: 'off' });
  test('difficulty: high stacks, bounded zoom, small frames and reduced motion', async ({
    page,
  }, info) => {
    test.setTimeout(600_000);
    const errors: string[] = [];
    const failedAssets: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/assets/') && response.status() >= 400)
        failedAssets.push(response.url());
    });
    if (crazygames)
      await page.route(crazyGamesSdkUrl, (route) =>
        route.fulfill({
          contentType: 'application/javascript',
          body: `window.CrazyGames={SDK:{init:async()=>{},environment:'local',game:{settings:{muteAudio:false},gameplayStart:()=>{},gameplayStop:()=>{},loadingStart:()=>{},loadingStop:()=>{},happytime:()=>{},addSettingsChangeListener:()=>{},removeSettingsChangeListener:()=>{}}}};`,
        }),
      );
    const advance = (ms: number) =>
      preview
        ? page.clock.runFor(ms)
        : page.evaluate((ms) => window.__COIN_TOWER__!.advance(ms), ms);
    const snapshot = () =>
      page.evaluate(() => window.__COIN_TOWER__!.snapshot());
    const observations: unknown[] = [];
    async function ready() {
      await page.goto(preview ? '/' : '/?debug');
      await expect(page.locator('#play')).toBeEnabled();
      if (preview) {
        await page.clock.install();
        await page.clock.pauseAt(new Date(Date.now() + 1000));
        expect(
          await page.evaluate(() => window.__COIN_TOWER__),
        ).toBeUndefined();
      } else await page.evaluate(() => window.__COIN_TOWER__!.freeze(true));
      await activate(page, info, '#play');
    }
    async function place(score: number, offset = 0) {
      if (preview) await advance((232 / moveSpeed(score)) * 1000);
      else {
        const run = await snapshot();
        await advance(
          (Math.abs(run.activeX - run.targetX - offset) / run.speed) * 1000,
        );
      }
      await activate(page, info, '#game canvas');
      await advance(preview ? 282 : 1000);
      await expect(page.locator('#score')).toHaveText(String(score + 1));
      if (!preview && score === 20) {
        await advance(rules.settleMs / 2);
        const held = await snapshot();
        expect(held.zoom).toBeCloseTo(0.99875, 8);
        await activate(page, info, '#pause');
        await advance(5000);
        expect((await snapshot()).zoom).toBe(held.zoom);
        await activate(page, info, '#continue');
        await advance(3000);
        expect((await snapshot()).zoom).toBe(held.zoom);
        await advance(rules.settleMs / 2);
      } else await advance(rules.settleMs);
      if (
        preview &&
        (await page.locator('#surface').getAttribute('data-phase')) !== 'moving'
      )
        await advance(16);
      await expect(page.locator('#surface')).toHaveAttribute(
        'data-phase',
        'moving',
      );
    }
    async function miss(direction: -1 | 1) {
      if (preview) {
        // 요청한 실패 방향의 끝점으로 실제 이동한 뒤 낙하한다.
        const score = Number(await page.locator('#score').textContent());
        const spawnSide = score % 2 === 0 ? -1 : 1;
        if (spawnSide !== direction)
          await advance(((2 * rules.laneHalfWidth) / moveSpeed(score)) * 1000);
        await activate(page, info, '#game canvas');
        await advance(282);
      } else {
        const run = await snapshot();
        const target = run.targetX + direction * 100;
        await advance((Math.abs(run.activeX - target) / run.speed) * 1000);
        await activate(page, info, '#game canvas');
        await advance(1000);
        expect((await snapshot()).failureDirection).toBe(direction);
      }
      await expect(page.locator('#surface')).toHaveAttribute(
        'data-mode',
        'result',
      );
      await expect(page.locator('#result-screen')).toBeHidden();
    }
    await ready();
    const initialScoreFont = await page
      .locator('#score')
      .evaluate((el) => getComputedStyle(el).fontSize);
    for (let score = 0; score < 101; score++) {
      await place(
        score,
        !preview && score === 2 ? 35 : !preview && score === 3 ? -35 : 0,
      );
      if ([20, 40, 60, 100, 101].includes(score + 1)) {
        if (!preview) {
          const run = await snapshot();
          const view = await page.evaluate(() => window.__COIN_TOWER__!.view());
          const feedback = await page.evaluate(() =>
            window.__COIN_TOWER__!.feedback(),
          );
          expect(run.speed).toBeCloseTo(moveSpeed(score + 1), 8);
          expect(run.zoom).toBeCloseTo(cameraZoom(score + 1), 8);
          expect(view.active.width).toBeCloseTo(166 * run.zoom, 6);
          expect(view.top!.width).toBeCloseTo(166 * run.zoom, 6);
          expect(view.active.y).toBeCloseTo(896 - 410 * run.zoom, 6);
          expect(view.top!.y).toBeCloseTo(896 + 56 * run.zoom, 6);
          expect(view.visibleCoins).toBeLessThan(20);
          expect(feedback.label.width).toBe(320);
          observations.push({ run, view, feedback });
        } else {
          observations.push({
            score: Number(await page.locator('#score').textContent()),
            phase: await page.locator('#surface').getAttribute('data-phase'),
            developmentHook: await page.evaluate(
              () => typeof window.__COIN_TOWER__,
            ),
          });
        }
        expect(
          await page
            .locator('#score')
            .evaluate((el) => getComputedStyle(el).fontSize),
        ).toBe(initialScoreFont);
        await page.screenshot({
          path: info.outputPath(`difficulty-${score + 1}.png`),
          fullPage: true,
        });
      }
    }
    for (const viewport of [
      { width: 360, height: 640 },
      { width: 390, height: 844 },
      { width: 821, height: 462 },
      { width: 907, height: 510 },
    ]) {
      await page.setViewportSize(viewport);
      for (const selector of ['#pause', '#mute']) {
        // 가로/세로 전환 시 조작 버튼은 다음 렌더 프레임에 측면·기둥으로 옮겨진다.
        await expect(page.locator(selector)).toBeVisible();
        const box = (await page.locator(selector).boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`difficulty-101-${viewport.width}.png`),
        fullPage: true,
      });
    }
    await miss(-1);
    await advance(200);
    await page.screenshot({
      path: info.outputPath('difficulty-miss-left.png'),
      fullPage: true,
    });
    const finished = !preview ? await snapshot() : null;
    await advance(200);
    if (finished) expect((await snapshot()).zoom).toBe(finished.zoom);
    await expect(page.locator('#result-shards-earned')).toHaveText('+101');
    await activate(page, info, '#retry');
    if (!preview) expect((await snapshot()).zoom).toBe(1);
    await expect(page.locator('#score')).toHaveText('0');
    if (preview) await page.clock.resume();
    await page.evaluate(
      (key) => localStorage.removeItem(key),
      `${gameConfig.storagePrefix}:settings`,
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready();
    for (let score = 0; score < 60; score++) await place(score);
    if (!preview) expect((await snapshot()).zoom).toBe(0.9);
    await page.screenshot({
      path: info.outputPath('difficulty-reduced-60.png'),
      fullPage: true,
    });
    await miss(1);
    await expect(page.locator('#miss-feedback')).toBeVisible();
    await page.screenshot({
      path: info.outputPath('difficulty-reduced-miss.png'),
      fullPage: true,
    });
    await advance(500);
    await activate(page, info, '#home');
    if (!preview) expect((await snapshot()).zoom).toBe(1);
    await expect(page.locator('#title-screen')).toBeVisible();
    const progress = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).data,
      `${gameConfig.storagePrefix}:save`,
    );
    expect(progress).toMatchObject({
      best: 101,
      rounds: 2,
      shards: 161,
      ownedSkins: ['gold'],
      equippedSkin: 'gold',
      onboardingComplete: true,
    });
    expect(errors).toEqual([]);
    expect(failedAssets).toEqual([]);
    await writeFile(
      info.outputPath('difficulty-observations.json'),
      JSON.stringify(observations, null, 2),
    );
    await info.attach('difficulty-observations', {
      body: JSON.stringify(observations, null, 2),
      contentType: 'application/json',
    });
  });
}
