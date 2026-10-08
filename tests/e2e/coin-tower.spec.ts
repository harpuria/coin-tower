import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { gameConfig } from '../../src/config/game';
import { rules } from '../../src/game/rules';

const preview = process.env.E2E_PREVIEW === '1';
const saveKey = `${gameConfig.storagePrefix}:save`;

async function ready(page: Page, debug = false) {
  await page.goto(debug ? '/?debug' : '/');
  await expect(page.locator('#play')).toBeEnabled();
  await expect(page.locator('#loading-overlay')).toBeHidden();
  if (debug) {
    await expect
      .poll(() => page.evaluate(() => !!window.__COIN_TOWER__))
      .toBe(true);
    await page.evaluate(() => window.__COIN_TOWER__!.freeze(true));
  }
}
async function tapGame(page: Page, info: TestInfo) {
  const canvas = page.locator('#game canvas');
  if (info.project.name === 'mobile') await canvas.tap();
  else await canvas.click();
}
const snapshot = (page: Page) =>
  page.evaluate(() => window.__COIN_TOWER__!.snapshot());
const advance = (page: Page, ms: number) =>
  page.evaluate((delta) => window.__COIN_TOWER__!.advance(delta), ms);

async function place(page: Page, info: TestInfo, offset = 0) {
  const run = await snapshot(page);
  const x = run.targetX + offset;
  await advance(page, (Math.abs(run.activeX - x) / run.speed) * 1000);
  await tapGame(page, info);
  await advance(page, 1000);
  if ((await snapshot(page)).mode === 'playing')
    await advance(page, rules.settleMs);
}

test('real mouse/touch start, drop, first miss, retry, home, and saved best', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const sdkRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('sdk.crazygames.com'))
      sdkRequests.push(request.url());
  });
  await ready(page);
  const panelLoaded = await page.evaluate(async () => {
    const background = getComputedStyle(
      document.querySelector('.blue-panel')!,
    ).backgroundImage;
    const url = background.match(/url\(["']?(.*?)["']?\)/)?.[1];
    if (!url) return false;
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      return image.naturalWidth > 0;
    } catch {
      return false;
    }
  });
  expect(panelLoaded).toBe(true);
  await tapGame(page, info);
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-mode',
    'playing',
  );
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await expect(page.locator('#score')).toHaveText('0');
  await tapGame(page, info);
  await expect(page.locator('#score')).toHaveText('1');
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await tapGame(page, info);
  await expect(page.locator('#result-screen')).toBeVisible();
  await expect(page.locator('#result-score')).toHaveText('1');
  await expect(page.locator('#result-best')).toHaveText('1');
  await page.screenshot({
    path: info.outputPath('result.png'),
    fullPage: true,
  });
  await page.locator('#result-screen').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('#result-screen')).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).data.rounds,
      saveKey,
    ),
  ).toBe(1);
  await page.locator('#retry').click();
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await page.locator('#pause').click();
  await page.locator('#pause-home').click();
  await page.locator('#confirm-yes').click();
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#title-best')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#title-best')).toHaveText('1');
  const box = (await page.locator('#game canvas').boundingBox())!;
  expect(box.width / box.height).toBeCloseTo(9 / 16, 2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath('title.png'), fullPage: true });
  expect(errors).toEqual([]);
  expect(sdkRequests).toEqual([]);
  if (preview)
    expect(await page.evaluate(() => window.__COIN_TOWER__)).toBeUndefined();
});

test('pause/countdown prevents drops and background return stays paused', async ({
  page,
}, info) => {
  await ready(page);
  await page.locator('#play').click();
  await page.locator('#pause').click();
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.locator('#restart').click();
  await page.locator('#confirm-no').click();
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.locator('#continue').click();
  await expect(page.locator('#countdown')).toHaveText('3');
  await page.locator('#countdown-overlay').click();
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#countdown-overlay')).toBeHidden({
    timeout: 10_000,
  });
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#pause-overlay')).toBeVisible();
  // 이동·낙하·착지 목표의 세로 영역을 메뉴로 가리지 않는다.
  const canvas = (await page.locator('#game canvas').boundingBox())!;
  const heading = (await page.locator('.pause-heading').boundingBox())!;
  const actions = (await page.locator('.pause-actions').boundingBox())!;
  const scale = canvas.height / rules.height;
  expect(heading.y + heading.height).toBeLessThan(
    canvas.y +
      (rules.height * rules.targetFraction - rules.spawnGap - 51) * scale,
  );
  expect(actions.y).toBeGreaterThan(
    canvas.y +
      (rules.height * rules.targetFraction + rules.coinHeight + 51) * scale,
  );
  const utility = (await page.locator('.utility').boundingBox())!;
  expect(actions.y + actions.height).toBeLessThan(utility.y);
  await page.screenshot({ path: info.outputPath('pause.png'), fullPage: true });
  await page.locator('#restart').click();
  await page.locator('#confirm-yes').click();
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), saveKey),
  ).toBeNull();
  await page.locator('#mute').click();
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#play')).toBeVisible();
});

test('deterministic real-input Perfect/combo, speed cap, camera, miss and reset', async ({
  page,
}, info) => {
  test.setTimeout(90_000); // 실제 입력 22회와 원본 PNG 로딩·스크린샷을 포함한다.
  test.skip(
    preview,
    'development-only time control is excluded from production',
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page, true);
  await tapGame(page, info);
  expect((await snapshot(page)).phase).toBe('moving');
  await place(page, info);
  expect((await snapshot(page)).streak).toBe(0);
  for (let index = 1; index < 6; index++) await place(page, info);
  await expect(page.locator('#combo-count')).toHaveText('x5');
  await expect(page.locator('#tap-prompt')).toBeHidden();
  expect((await snapshot(page)).score).toBe(6);
  // 낙하를 시작한 채 입력을 반복해도 같은 동전 하나만 처리한다.
  const state = await snapshot(page);
  await advance(
    page,
    (Math.abs(state.activeX - state.targetX) / state.speed) * 1000,
  );
  await tapGame(page, info);
  await tapGame(page, info);
  await advance(page, 1000);
  expect((await snapshot(page)).score).toBe(7);
  await expect(page.locator('#combo-count')).toHaveText('x6');
  await tapGame(page, info);
  await advance(page, rules.settleMs);
  expect((await snapshot(page)).phase).toBe('moving');
  await place(page, info, 35);
  await expect(page.locator('#combo')).toBeHidden();
  for (let index = 8; index < 21; index++) await place(page, info);
  const high = await snapshot(page);
  expect(high.score).toBe(21);
  expect(high.combo).toBe(13);
  expect(high.maxCombo).toBe(13);
  await expect(page.locator('#combo-count')).toHaveText('x13');
  expect(
    await page.evaluate((key) => localStorage.getItem(key), saveKey),
  ).toBeNull();
  expect(high.speed).toBe(rules.maxSpeed);
  expect(high.cameraOffset).toBe(rules.coinHeight * 21);
  await page.screenshot({
    path: info.outputPath('stack-combo.png'),
    fullPage: true,
  });
  await place(page, info, -100);
  await expect(page.locator('#result-score')).toHaveText('21');
  expect((await snapshot(page)).combo).toBe(0);
  expect((await snapshot(page)).maxCombo).toBe(13);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      saveKey,
    ),
  ).toEqual({
    version: 2,
    data: { best: 21, bestCombo: 13, rounds: 1 },
  });
  await page.locator('#retry').click();
  const fresh = await snapshot(page);
  expect(fresh.score).toBe(0);
  expect(fresh.streak).toBe(0);
  expect(fresh.maxCombo).toBe(0);
  expect(fresh.cameraOffset).toBe(0);
  expect(fresh.speed).toBe(rules.baseSpeed);
  expect(fresh.phase).toBe('moving');
  await page.reload();
  await expect(page.locator('#title-best')).toHaveText('21');
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).data.bestCombo,
      saveKey,
    ),
  ).toBe(13);
  expect(errors).toEqual([]);
});

test('x100 fits the combo panel and an unfinished record is discarded on reload', async ({
  page,
}, info) => {
  test.skip(preview, 'development-only deterministic preparation');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page, true);
  await page.locator('#play').click();
  // 준비만 합성 입력으로 진행하고 x100 착지는 실제 마우스·터치를 사용한다.
  await page.evaluate((settleMs) => {
    const debug = window.__COIN_TOWER__!;
    const canvas = document.querySelector('#game canvas')!;
    for (let index = 0; index < 100; index++) {
      const run = debug.snapshot();
      debug.advance((Math.abs(run.activeX - run.targetX) / run.speed) * 1000);
      canvas.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          button: 0,
          isPrimary: true,
        }),
      );
      debug.advance(1000);
      debug.advance(settleMs);
    }
  }, rules.settleMs);
  expect((await snapshot(page)).combo).toBe(99);
  await place(page, info);
  await expect(page.locator('#combo-count')).toHaveText('x100');
  expect((await snapshot(page)).maxCombo).toBe(100);
  const bounds = await page.locator('#combo').boundingBox();
  const count = await page.locator('#combo-count').boundingBox();
  expect(count!.x).toBeGreaterThan(bounds!.x);
  expect(count!.x + count!.width).toBeLessThan(bounds!.x + bounds!.width);
  expect(
    await page
      .locator('#combo')
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath('combo-x100.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate((key) => localStorage.getItem(key), saveKey),
  ).toBeNull();
  await page.reload();
  await expect(page.locator('#title-best')).toHaveText('0');
  expect(
    await page.evaluate((key) => localStorage.getItem(key), saveKey),
  ).toBeNull();
  expect(errors).toEqual([]);
});

test('v1 migration preserves height and v2 combo best survives a lower completed run', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({ version: 1, data: { best: 30, rounds: 12 } }),
    );
  }, saveKey);
  await ready(page);
  await expect(page.locator('#title-best')).toHaveText('30');
  await page.locator('#play').click();
  await tapGame(page, info);
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await expect(page.locator('#score')).toHaveText('1');
  await tapGame(page, info);
  await expect(page.locator('#result-screen')).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      saveKey,
    ),
  ).toEqual({
    version: 2,
    data: { best: 30, bestCombo: 0, rounds: 13 },
  });
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 2,
        data: { best: 30, bestCombo: 8, rounds: 13 },
      }),
    );
  }, saveKey);
  await ready(page);
  await page.locator('#play').click();
  await tapGame(page, info);
  await expect(page.locator('#score')).toHaveText('1');
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await tapGame(page, info);
  await expect(page.locator('#result-screen')).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).data,
      saveKey,
    ),
  ).toEqual({
    best: 30,
    bestCombo: 8,
    rounds: 14,
  });
});

test('pause preserves dropping/settling and interrupted countdown starts again', async ({
  page,
}, info) => {
  test.skip(preview, 'development-only precise state observation');
  await ready(page, true);
  await page.locator('#play').click();
  await tapGame(page, info);
  await advance(page, 100);
  const falling = await snapshot(page);
  await page.locator('#pause').click();
  await advance(page, 5000);
  expect((await snapshot(page)).activeY).toBe(falling.activeY);
  await page.locator('#continue').click();
  await advance(page, 1500);
  await page.evaluate(() => {
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
  });
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.locator('#continue').click();
  await expect(page.locator('#countdown')).toHaveText('3');
  for (const label of ['2', '1']) {
    await advance(page, 1000);
    await expect(page.locator('#countdown')).toHaveText(label);
  }
  await advance(page, 1000);
  expect((await snapshot(page)).activeY).toBe(falling.activeY);
  await advance(page, 1000);
  await advance(page, 100);
  const settling = await snapshot(page);
  expect(settling.phase).toBe('settling');
  await page.locator('#pause').click();
  await advance(page, 5000);
  expect((await snapshot(page)).cameraOffset).toBe(settling.cameraOffset);
  await page.locator('#continue').click();
  await advance(page, 3000);
  await advance(page, 180);
  expect((await snapshot(page)).phase).toBe('moving');
});

test('corrupt progress is preserved while the player can still complete a run', async ({
  page,
}, info) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, 'broken'),
    saveKey,
  );
  await ready(page);
  await expect(page.locator('#storage-notice')).toContainText(
    'cannot be saved',
  );
  await page.locator('#play').click();
  await tapGame(page, info);
  await expect(page.locator('#score')).toHaveText('1');
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await tapGame(page, info);
  await expect(page.locator('#result-screen')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), saveKey)).toBe(
    'broken',
  );
});

test('asset failure and uncaught errors offer reload without claiming readiness', async ({
  page,
}) => {
  await page.route('**/assets/coin-tower/coin.png', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('#error-overlay')).toContainText(
    'Unable to load game files',
  );
  await expect(page.locator('#play')).toBeDisabled();
  await page.unrouteAll();
  await ready(page);
  await page.locator('#play').click();
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error('recovery fixture');
    });
  });
  await expect(page.getByRole('alert')).toContainText('recovery fixture');
  await expect(page.locator('#reload')).toBeVisible();
  await expect(page.locator('#mode-label')).toHaveText('PAUSED');
});

test('storage quota failure keeps gameplay available and reports the failed save', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
  });
  await ready(page);
  await page.locator('#play').click();
  await tapGame(page, info);
  await expect(page.locator('#score')).toHaveText('1');
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await tapGame(page, info);
  await expect(page.locator('#result-score')).toHaveText('1');
  await expect(page.locator('#storage-notice')).toContainText(
    'cannot be saved',
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), saveKey),
  ).toBeNull();
  await page.locator('#retry').click();
  await expect(page.locator('#score')).toHaveText('0');
});

test('viewport changes keep portrait proportions, with fullscreen on desktop', async ({
  page,
}, info) => {
  await ready(page, !preview);
  if (info.project.name === 'desktop') {
    await page.locator('#fullscreen').click();
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement?.id))
      .toBe('stage');
    await page.locator('#fullscreen').click();
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement))
      .toBeNull();
  }
  await page.locator('#play').click();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 900, height: 420 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    const canvas = (await page.locator('#game canvas').boundingBox())!;
    expect(canvas.width / canvas.height).toBeCloseTo(9 / 16, 2);
    expect(canvas.x).toBeGreaterThanOrEqual(-1);
    expect(canvas.y).toBeGreaterThanOrEqual(-1);
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(viewport.height + 1);
    await expect(page.locator('#score')).toHaveText('0');
    if (!preview) {
      const before = await snapshot(page);
      await advance(page, 100);
      const after = await snapshot(page);
      expect(Math.abs(after.activeX - before.activeX)).toBeCloseTo(
        rules.baseSpeed / 10,
      );
    }
  }
});
