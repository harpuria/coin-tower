import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { backgroundRules } from '../../src/game/backgrounds';
import { rules } from '../../src/game/rules';

const preview = process.env.E2E_PREVIEW === '1';
const snapshot = (page: Page) =>
  page.evaluate(() => window.__COIN_TOWER__!.snapshot());
const rendered = (page: Page) =>
  page.evaluate(() => window.__COIN_TOWER__!.background());
const advance = (page: Page, ms: number) =>
  page.evaluate((delta) => window.__COIN_TOWER__!.advance(delta), ms);
const texture = {
  morning: 'background',
  noon: 'backgroundNoon',
  evening: 'backgroundEvening',
  night: 'backgroundNight',
} as const;

async function ready(page: Page) {
  await page.goto('/?debug');
  await expect(page.locator('#play')).toBeEnabled();
  await expect
    .poll(() => page.evaluate(() => !!window.__COIN_TOWER__))
    .toBe(true);
  await page.evaluate(() => window.__COIN_TOWER__!.freeze(true));
}

async function pressGame(page: Page, info: TestInfo, space = false) {
  if (info.project.name === 'mobile') await page.locator('#game canvas').tap();
  else if (space) await page.keyboard.press('Space');
  else await page.locator('#game canvas').click();
}

// 위치를 덮어쓰지 않고 결정적 시간 제어와 실제 브라우저 입력으로 착지한다.
async function land(page: Page, info: TestInfo, offset = 0) {
  const run = await snapshot(page);
  expect(run.phase).toBe('moving');
  const target = run.targetX + offset;
  const left = rules.width / 2 - rules.laneHalfWidth;
  const right = rules.width / 2 + rules.laneHalfWidth;
  const distance =
    run.direction > 0
      ? target >= run.activeX
        ? target - run.activeX
        : right - run.activeX + right - target
      : target <= run.activeX
        ? run.activeX - target
        : run.activeX - left + target - left;
  await advance(page, (distance / run.speed) * 1000);
  expect((await snapshot(page)).activeX).toBeCloseTo(target, 6);
  await pressGame(page, info, run.score % 2 === 0);
  expect((await snapshot(page)).phase).toBe('dropping');
  await advance(page, Math.ceil((rules.spawnGap / rules.fallSpeed) * 1000));
}

async function assertRender(page: Page) {
  // 자동 RAF 중에도 같은 프레임의 모델과 렌더 값을 채집한다.
  const { run, scene } = await page.evaluate(() => {
    const debug = window.__COIN_TOWER__!;
    return { run: debug.snapshot(), scene: debug.background() };
  });
  expect(scene.base.key).toBe(texture[run.background.from]);
  expect(scene.next.key).toBe(texture[run.background.to]);
  expect(scene.base.alpha).toBe(1);
  expect(scene.base.visible).toBe(true);
  for (const image of [scene.base, scene.next]) {
    expect(image.width).toBeCloseTo(rules.width, 6);
    expect(image.height).toBeCloseTo(rules.height, 6);
  }
  expect(scene.next.visible).toBe(run.background.from !== run.background.to);
  const t = run.background.progress;
  expect(scene.next.alpha).toBeCloseTo(t * t * (3 - 2 * t), 6);
  return { run, scene };
}

async function expectMorning(page: Page) {
  expect((await snapshot(page)).background).toEqual({
    from: 'morning',
    to: 'morning',
    progress: 1,
  });
  await assertRender(page);
}

test('background milestones crossfade and freeze through pause/countdown', async ({
  page,
}, info) => {
  test.skip(
    preview,
    'precise milestone/render observation uses development-only controls',
  );
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const failedAssets: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/assets/') && response.status() >= 400)
      failedAssets.push(response.url());
  });
  await ready(page);
  await expectMorning(page);
  // PC는 게임 영역 클릭 전 Space로 시작하며 모바일은 실제 터치로 시작한다.
  await pressGame(page, info, true);
  expect((await snapshot(page)).score).toBe(0);
  expect((await snapshot(page)).phase).toBe('moving');
  const observations: unknown[] = [];
  const times = [
    'morning',
    'noon',
    'evening',
    'night',
    'morning',
    'noon',
  ] as const;
  for (let score = 1; score <= 25; score++) {
    const before = (await snapshot(page)).background;
    await land(page, info);
    expect((await snapshot(page)).score).toBe(score);
    if (score % 5 !== 0) {
      expect((await snapshot(page)).background.to).toBe(before.to);
      if ([6, 11, 16, 21].includes(score)) {
        await expect(page.locator('#combo')).toBeVisible();
        await page.screenshot({
          path: info.outputPath(`bg-${score}-perfect.png`),
        });
      }
      await advance(page, rules.settleMs);
      continue;
    }
    const stage = score / 5;
    expect((await snapshot(page)).background).toEqual({
      from: times[stage - 1],
      to: times[stage],
      progress: 0,
    });
    observations.push(await assertRender(page));
    await page.screenshot({ path: info.outputPath(`bg-${score}-start.png`) });
    await advance(page, backgroundRules.fadeMs / 4);
    observations.push(await assertRender(page));
    expect((await rendered(page)).next.alpha).toBeCloseTo(0.15625, 6);
    await advance(page, backgroundRules.fadeMs / 4);
    const middle = await assertRender(page);
    observations.push(middle);
    expect(middle.scene.next.alpha).toBeCloseTo(0.5, 6);
    await page.screenshot({ path: info.outputPath(`bg-${score}-middle.png`) });
    if (score === 5) {
      await page.locator('#pause').click();
      await advance(page, 5000);
      expect((await snapshot(page)).background).toEqual(middle.run.background);
      expect(await rendered(page)).toEqual(middle.scene);
      await page.keyboard.press('Space');
      expect((await snapshot(page)).score).toBe(score);
      await page.locator('#continue').click();
      await advance(page, 1000);
      expect((await snapshot(page)).background).toEqual(middle.run.background);
      // 환경 이벤트를 합성해 재개 중 재중단을 확인한다. 실기기 탭 전환 검사는 아니다.
      await page.evaluate(() => {
        window.dispatchEvent(new Event('blur'));
        window.dispatchEvent(new Event('focus'));
      });
      await expect(page.locator('#pause-overlay')).toBeVisible();
      await advance(page, 5000);
      expect(await rendered(page)).toEqual(middle.scene);
      await page.locator('#continue').click();
      for (const label of ['3', '2', '1']) {
        await expect(page.locator('#countdown')).toHaveText(label);
        await advance(page, 1000);
        expect((await snapshot(page)).background).toEqual(
          middle.run.background,
        );
        expect(await rendered(page)).toEqual(middle.scene);
      }
      await expect(page.locator('#countdown-overlay')).toBeHidden();
    }
    await advance(page, backgroundRules.fadeMs / 4);
    observations.push(await assertRender(page));
    expect((await rendered(page)).next.alpha).toBeCloseTo(0.84375, 6);
    await advance(page, backgroundRules.fadeMs / 4);
    expect((await snapshot(page)).background).toEqual({
      from: times[stage],
      to: times[stage],
      progress: 1,
    });
    observations.push(await assertRender(page));
    await page.screenshot({
      path: info.outputPath(`bg-${score}-complete.png`),
    });
  }
  // 실시간 RAF에서 동전이 이동해도 완료된 배경 상태는 유지한다.
  const x = (await snapshot(page)).activeX;
  await page.evaluate(() => window.__COIN_TOWER__!.freeze(false));
  await expect.poll(async () => (await snapshot(page)).activeX).not.toBe(x);
  await page.evaluate(() => window.__COIN_TOWER__!.freeze(true));
  expect((await snapshot(page)).background.to).toBe('noon');
  expect(errors).toEqual([]);
  expect(failedAssets).toEqual([]);
  await info.attach('background-observations', {
    body: JSON.stringify(observations, null, 2),
    contentType: 'application/json',
  });
});

test('background mid-fade restart home and first failure preserve/reset correctly', async ({
  page,
}, info) => {
  test.skip(
    preview,
    'precise lifecycle observation uses development-only controls',
  );
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await page.locator('#play').click();
  async function reachFive() {
    for (let score = 1; score <= 5; score++) {
      await land(page, info);
      if (score < 5) await advance(page, rules.settleMs);
    }
    expect((await snapshot(page)).background.progress).toBe(0);
  }
  await reachFive();
  await advance(page, backgroundRules.fadeMs / 2);
  const middle = await rendered(page);
  await page.locator('#pause').click();
  await page.locator('#restart').click();
  await page.locator('#confirm-no').click();
  expect(await rendered(page)).toEqual(middle);
  await page.locator('#restart').click();
  await page.locator('#confirm-yes').click();
  expect((await snapshot(page)).score).toBe(0);
  expect((await snapshot(page)).phase).toBe('moving');
  await expectMorning(page);
  await page.screenshot({ path: info.outputPath('bg-restarted.png') });
  await reachFive();
  await advance(page, backgroundRules.fadeMs / 2);
  await page.locator('#pause').click();
  await page.locator('#pause-home').click();
  await page.locator('#confirm-yes').click();
  expect((await snapshot(page)).mode).toBe('menu');
  await expectMorning(page);
  await page.locator('#play').click();
  await reachFive();
  await advance(page, rules.settleMs);
  await land(page, info, rules.diameter * 0.4);
  const result = await snapshot(page);
  expect(result.mode).toBe('result');
  expect(result.score).toBe(5);
  expect(result.background.progress).toBeGreaterThan(0);
  expect(result.background.progress).toBeLessThan(1);
  const finished = await assertRender(page);
  await advance(page, 5000);
  expect((await snapshot(page)).background).toEqual(result.background);
  expect(await rendered(page)).toEqual(finished.scene);
  await page.screenshot({ path: info.outputPath('bg-result-mid-fade.png') });
  await page.locator('#retry').click();
  expect((await snapshot(page)).score).toBe(0);
  await expectMorning(page);
  await reachFive();
  await page.evaluate(() => window.__COIN_TOWER__!.freeze(false));
  await expect
    .poll(async () => (await snapshot(page)).background.progress)
    .toBeGreaterThan(0.1);
  const live = await assertRender(page);
  expect(live.run.background.progress).toBeLessThan(1);
  expect(live.scene.next.visible).toBe(true);
  await expect
    .poll(async () => (await snapshot(page)).background.progress)
    .toBe(1);
  await page.evaluate(() => window.__COIN_TOWER__!.freeze(true));
  expect((await snapshot(page)).background.to).toBe('noon');
  await assertRender(page);
  expect(errors).toEqual([]);
});
