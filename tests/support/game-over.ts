import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { gameConfig } from '../../src/config/game';
import { moveSpeed } from '../../src/game/rules';
import { progressSchema } from '../../src/game/save';
import { crazyGamesSdkUrl } from '../../src/services/crazygames';

const saveKey = `${gameConfig.storagePrefix}:save`;
const preview = process.env.E2E_PREVIEW === '1';
async function activate(page: Page, info: TestInfo, selector: string) {
  if (info.project.name === 'mobile') await page.locator(selector).tap();
  else await page.locator(selector).click();
}
async function assertLayout(page: Page) {
  const surface = (await page.locator('#surface').boundingBox())!;
  const selectors = [
    '.result-heading',
    '.result-stats',
    '.shard-reward',
    '.result-actions',
  ];
  const boxes = await Promise.all(
    selectors.map((s) => page.locator(s).boundingBox()),
  );
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i]!;
    expect(box.x).toBeGreaterThanOrEqual(surface.x - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(
      surface.x + surface.width + 1,
    );
    expect(box.y).toBeGreaterThanOrEqual(surface.y - 1);
    if (i)
      expect(box.y).toBeGreaterThanOrEqual(
        boxes[i - 1]!.y + boxes[i - 1]!.height - 1,
      );
  }
  const utility = (await page.locator('.utility').boundingBox())!;
  expect(boxes.at(-1)!.y + boxes.at(-1)!.height).toBeLessThanOrEqual(utility.y);
  for (const selector of ['#retry', '#home']) {
    const box = (await page.locator(selector).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(
    await page
      .locator('#result-screen')
      .evaluate(
        (root) =>
          root.scrollHeight <= root.clientHeight + 1 &&
          [
            ...root.querySelectorAll<HTMLElement>(
              'strong, .record-badge:not([hidden]), .result-best-line > span, .result-combo-best > span',
            ),
          ].every(
            (el) =>
              parseFloat(getComputedStyle(el).fontSize) >= 14 &&
              el.scrollWidth <= el.clientWidth + 1,
          ),
      ),
  ).toBe(true);
  const retry = (await page.locator('#retry').boundingBox())!;
  const home = (await page.locator('#home').boundingBox())!;
  expect(home.y).toBeGreaterThanOrEqual(retry.y + retry.height);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

/** 배포 훅 없이 시간과 실제 포인터 입력으로 네 배경의 결과를 만든다. */
export function gameOverCases(crazygames = false) {
  for (const scenario of [
    {
      name: 'morning-height',
      score: 2,
      best: 1,
      bestCombo: 8,
      background: 'background',
      newHeight: true,
      newCombo: false,
    },
    {
      name: 'noon-combo',
      score: 12,
      best: 30,
      bestCombo: 1,
      background: 'backgroundNoon',
      newHeight: false,
      newCombo: true,
    },
    {
      name: 'evening-tie',
      score: 22,
      best: 22,
      bestCombo: 21,
      background: 'backgroundEvening',
      newHeight: false,
      newCombo: false,
    },
    {
      name: 'night-both',
      score: 32,
      best: 0,
      bestCombo: 0,
      background: 'backgroundNight',
      newHeight: true,
      newCombo: true,
    },
  ])
    test(`game over: ${scenario.name} records, rewards and small layouts`, async ({
      page,
    }, info) => {
      test.setTimeout(180_000);
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('response', (r) => {
        if (r.url().includes('/assets/') && r.status() >= 400)
          errors.push(`${r.status()} ${r.url()}`);
      });
      if (crazygames)
        await page.route(crazyGamesSdkUrl, (route) =>
          route.fulfill({
            contentType: 'application/javascript',
            body: `window.CrazyGames={SDK:{init:async()=>{},environment:'local',game:{settings:{muteAudio:false},gameplayStart:()=>{},gameplayStop:()=>{},addSettingsChangeListener:()=>{},removeSettingsChangeListener:()=>{}}}};`,
          }),
        );
      await page.addInitScript(
        ({ key, data }) => {
          if (!localStorage.getItem(key))
            localStorage.setItem(key, JSON.stringify({ version: 5, data }));
        },
        {
          key: saveKey,
          data: {
            ...progressSchema.defaults(),
            best: scenario.best,
            bestCombo: scenario.bestCombo,
            shards: 49,
            onboardingComplete: true,
          },
        },
      );
      await page.goto('/');
      await expect(page.locator('#play')).toBeEnabled();
      if (preview)
        expect(
          await page.evaluate(() => window.__COIN_TOWER__),
        ).toBeUndefined();
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      await activate(page, info, '#play');
      for (let score = 0; score < scenario.score; score++) {
        await page.clock.runFor((232 / moveSpeed(score)) * 1000);
        await activate(page, info, '#game canvas');
        // 낙하·정착 대부분은 묶어서 진행하고 마지막 프레임만 확인한다.
        await page.clock.runFor(500);
        for (let frame = 0; frame < 80; frame++) {
          await page.clock.runFor(16);
          if (
            (await page.locator('#surface').getAttribute('data-phase')) ===
            'moving'
          )
            break;
        }
        await expect(page.locator('#score')).toHaveText(String(score + 1));
      }
      await activate(page, info, '#game canvas');
      await page.clock.runFor(1000);
      await expect(page.locator('#result-screen')).toBeVisible();
      await expect
        .poll(
          async () => {
            await page.clock.runFor(16);
            return page.locator('#backdrop-base').getAttribute('data-time');
          },
          { timeout: 15000 },
        )
        .toBe(scenario.background);
      const expected = {
        best: Math.max(scenario.best, scenario.score),
        bestCombo: Math.max(scenario.bestCombo, scenario.score - 1),
        shards: 49 + scenario.score,
        rounds: 1,
      };
      await expect(page.locator('#result-score')).toHaveText(
        String(scenario.score),
      );
      await expect(page.locator('#result-best')).toHaveText(
        String(expected.best),
      );
      await expect(page.locator('#result-combo')).toHaveText(
        `x${scenario.score - 1}`,
      );
      await expect(page.locator('#result-best-combo')).toHaveText(
        `x${expected.bestCombo}`,
      );
      await expect(page.locator('#new-best-coins')).toBeVisible({
        visible: scenario.newHeight,
      });
      await expect(page.locator('#new-best-combo')).toBeVisible({
        visible: scenario.newCombo,
      });
      await expect(page.locator('#result-shards-earned')).toHaveText(
        `+${scenario.score}`,
      );
      await expect(
        page.locator(
          '#height-goal, #result-shop, .skin-goal, #result-shards-total, #result-screen table',
        ),
      ).toHaveCount(0);
      const resultText = await page.locator('#result-screen').evaluate((el) => {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.sr-only').forEach((node) => node.remove());
        return clone.textContent;
      });
      expect(resultText).not.toMatch(
        /THIS RUN|EARNED|TOTAL|NEXT GOAL|SHOP|COLLECTION COMPLETE/,
      );
      const fonts = await page.evaluate(() =>
        ['result-score', 'result-combo'].map((id) =>
          parseFloat(getComputedStyle(document.getElementById(id)!).fontSize),
        ),
      );
      expect(fonts[0]).toBeGreaterThan(fonts[1]!);
      for (const viewport of [
        { width: 821, height: 462 },
        { width: 907, height: 510 },
        { width: 360, height: 640 },
      ]) {
        await page.setViewportSize(viewport);
        await assertLayout(page);
        await page.screenshot({
          path: info.outputPath(`${scenario.name}-${viewport.width}.png`),
        });
      }
      const progress = () =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key)!).data,
          saveKey,
        );
      expect(await progress()).toMatchObject(expected);
      await page.clock.runFor(5000);
      expect(await progress()).toMatchObject(expected);
      if (scenario.name === 'night-both') {
        // 실제 획득 기록과 분리한 DOM 전용 자릿수·0 표시 스트레스 관측이다.
        for (const value of ['0', String(Number.MAX_SAFE_INTEGER)]) {
          await page.evaluate((value) => {
            for (const id of [
              'result-score',
              'result-best',
              'result-combo',
              'result-best-combo',
              'result-shards-earned',
            ]) {
              const el = document.getElementById(id)!;
              el.textContent =
                (id.includes('combo')
                  ? 'x'
                  : id.includes('shards')
                    ? '+'
                    : '') + value;
              el.style.setProperty(
                '--record-digits',
                String(el.textContent.length),
              );
            }
          }, value);
          for (const viewport of [
            { width: 821, height: 462 },
            { width: 360, height: 640 },
          ]) {
            await page.setViewportSize(viewport);
            await assertLayout(page);
            await page.screenshot({
              path: info.outputPath(
                `layout-only-${value}-${viewport.width}.png`,
              ),
            });
          }
        }
        await activate(page, info, '#home');
        await expect(page.locator('#title-shards')).toHaveText(
          String(expected.shards),
        );
        expect(await progress()).toMatchObject(expected);
        await page.clock.resume();
        await page.reload();
        await expect(page.locator('#play')).toBeEnabled();
        expect(await progress()).toMatchObject(expected);
      } else {
        await activate(page, info, '#retry');
        await expect(page.locator('#score')).toHaveText('0');
        await expect(page.locator('#surface')).toHaveAttribute(
          'data-phase',
          'moving',
        );
        expect(await progress()).toMatchObject(expected);
      }
      expect(errors).toEqual([]);
    });
}
