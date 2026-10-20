import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { gameConfig } from '../../src/config/game';
import { progressSchema } from '../../src/game/save';
import { rules } from '../../src/game/rules';
import { expectUtilityClear } from '../support/layout';

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
  else await advance(page, 400);
}

async function expectUnfinishedSave(page: Page) {
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      saveKey,
    ),
  ).toEqual({
    version: 5,
    data: { ...progressSchema.defaults(), onboardingComplete: true },
  });
}

async function expectComboArt(page: Page, value: number) {
  await expect(page.locator('#combo')).toBeVisible();
  await expect(page.locator('#combo-count')).toHaveText(`x${value}`);
  const glyphs = page.locator('.combo-glyphs img');
  await expect(glyphs).toHaveCount(String(value).length + 1);
  expect(
    await glyphs.evaluateAll(async (images) => {
      await Promise.all(
        images.map((image) => (image as HTMLImageElement).decode()),
      );
      return images.map((image) => {
        const glyph = image as HTMLImageElement;
        return {
          file: glyph.src.split('/').pop(),
          height: glyph.naturalHeight,
        };
      });
    }),
  ).toEqual(
    [...`x${value}`].map((glyph) => ({ file: `${glyph}.webp`, height: 192 })),
  );
  const bounds = (await page.locator('#combo').boundingBox())!;
  const row = (await page.locator('.combo-glyphs').boundingBox())!;
  const canvas = (await page.locator('#game canvas').boundingBox())!;
  const scale = canvas.height / rules.height;
  expect(row.x).toBeGreaterThan(bounds.x);
  expect(row.x + row.width).toBeLessThan(bounds.x + bounds.width);
  expect(row.y).toBeGreaterThanOrEqual(canvas.y + 360 * scale);
  expect(row.y + row.height).toBeLessThan(
    canvas.y +
      (rules.height * rules.targetFraction - rules.spawnGap - 51) * scale,
  );
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
      document.querySelector('.game-button')!,
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
  await expect(page.locator('#result-combo')).toHaveText('x0');
  await expect(page.locator('#result-best-combo')).toHaveText('x0');
  await expect(page.locator('#new-best-coins')).toBeVisible();
  await expect(page.locator('#new-best-combo')).toBeHidden();
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
  await expect(page.locator('#new-best-coins')).toBeHidden();
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await page.locator('#pause').click();
  await page.locator('#pause-home').click();
  await page.locator('#confirm-yes').click();
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#title-best')).toHaveText('1');
  await expect(page.locator('#title-best-combo')).toHaveText('x0');
  await page.reload();
  await expect(page.locator('#title-best')).toHaveText('1');
  await expect(page.locator('#title-best-combo')).toHaveText('x0');
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
  await expectUtilityClear(page, actions);
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

test('Perfect combo glyphs show on the landing frame after restart even on a slow network', async ({
  page,
}, info) => {
  await ready(page, true);
  // 캐시를 끄지 않는 지연만 걸어, 표시 시점의 새 이미지 요청이 숫자를 늦추는지 확인한다.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 800,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  for (const restart of [false, true]) {
    if (restart) {
      await page.locator('#pause').click();
      await page.locator('#restart').click();
      await page.locator('#confirm-yes').click();
    } else await page.locator('#play').click();
    await place(page, info);
    for (const combo of [1, 2]) {
      const run = await snapshot(page);
      await advance(
        page,
        (Math.abs(run.activeX - run.targetX) / run.speed) * 1000,
      );
      await tapGame(page, info);
      await advance(page, Math.ceil((rules.spawnGap / rules.fallSpeed) * 1000));
      expect((await snapshot(page)).combo).toBe(combo);
      await expect(page.locator('#combo')).toBeVisible();
      await expect
        .poll(
          () =>
            page
              .locator('.combo-glyphs img')
              .evaluateAll((images) =>
                images.map(
                  (image) =>
                    (image as HTMLImageElement).complete &&
                    (image as HTMLImageElement).naturalWidth > 0,
                ),
              ),
          { timeout: 300 },
        )
        .toEqual([true, true]);
      await advance(page, rules.settleMs);
    }
  }
});

test('deterministic real-input Perfect/combo, late speed growth, camera, miss and reset', async ({
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
  for (let index = 1; index < 6; index++) {
    await place(page, info);
    if (index <= 2) {
      await expectComboArt(page, index);
      await page.screenshot({
        path: info.outputPath(`combo-x${index}.png`),
        fullPage: true,
      });
    }
  }
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
  for (let index = 8; index < 21; index++) {
    await place(page, info);
    if ((await snapshot(page)).combo === 10) {
      await expectComboArt(page, 10);
      await page.screenshot({
        path: info.outputPath('combo-x10.png'),
        fullPage: true,
      });
    }
  }
  const high = await snapshot(page);
  expect(high.score).toBe(21);
  expect(high.combo).toBe(13);
  expect(high.maxCombo).toBe(13);
  await expect(page.locator('#combo-count')).toHaveText('x13');
  await expectUnfinishedSave(page);
  expect(high.speed).toBeGreaterThan(650);
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
    version: 5,
    data: {
      best: 21,
      bestCombo: 13,
      rounds: 1,
      shards: 21,
      ownedSkins: ['gold'],
      equippedSkin: 'gold',
      onboardingComplete: true,
    },
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

test('x100 glyphs fit below Perfect and an unfinished record is discarded on reload', async ({
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
  await expectComboArt(page, 100);
  expect((await snapshot(page)).maxCombo).toBe(100);
  const bounds = await page.locator('#combo').boundingBox();
  const count = await page.locator('.combo-glyphs').boundingBox();
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
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 821, height: 462 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(async () => {
        const canvas = (await page.locator('#game canvas').boundingBox())!;
        const surface = (await page.locator('#surface').boundingBox())!;
        return Math.abs(canvas.height - surface.height);
      })
      .toBeLessThan(1);
    await expectComboArt(page, 100);
    await page.screenshot({
      path: info.outputPath(`combo-x100-${viewport.width}.png`),
      fullPage: true,
    });
  }
  await advance(page, 240);
  await expect
    .poll(async () =>
      Number(await page.locator('#combo').evaluate((el) => el.style.opacity)),
    )
    .toBeCloseTo(180 / 280);
  await page.locator('#pause').click();
  await expect(page.locator('#combo')).toBeHidden();
  await page.locator('#continue').click();
  await expect(page.locator('#combo')).toBeHidden();
  await advance(page, 3000);
  await expectComboArt(page, 100);
  await advance(page, 180);
  await expect(page.locator('#combo')).toBeHidden();
  await expectUnfinishedSave(page);
  await page.reload();
  await expect(page.locator('#title-best')).toHaveText('0');
  await expectUnfinishedSave(page);
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
    version: 5,
    data: {
      best: 30,
      bestCombo: 0,
      rounds: 13,
      shards: 1,
      ownedSkins: ['gold'],
      equippedSkin: 'gold',
      onboardingComplete: false,
    },
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
    shards: 1,
    ownedSkins: ['gold'],
    equippedSkin: 'gold',
    onboardingComplete: false,
  });
});

test('result rows and menu bests distinguish each record break, ties and large combos', async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  test.skip(preview, 'development-only deterministic run preparation');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page, true);
  const cases = [
    {
      best: 30,
      bestCombo: 8,
      perfects: 12,
      ordinary: 7,
      newCoins: false,
      newCombo: true,
    },
    {
      best: 20,
      bestCombo: 12,
      perfects: 12,
      ordinary: 7,
      newCoins: false,
      newCombo: false,
    },
    {
      best: 1,
      bestCombo: 12,
      perfects: 1,
      ordinary: 0,
      newCoins: true,
      newCombo: false,
    },
    {
      best: 0,
      bestCombo: 0,
      perfects: 1,
      ordinary: 0,
      newCoins: true,
      newCombo: true,
    },
    {
      best: 0,
      bestCombo: 0,
      perfects: 0,
      ordinary: 0,
      newCoins: true,
      newCombo: false,
    },
    {
      best: 0,
      bestCombo: 0,
      perfects: 100,
      ordinary: 0,
      newCoins: true,
      newCombo: true,
    },
  ];
  for (const scenario of cases) {
    await page.evaluate(
      ({ key, best, bestCombo }) => {
        localStorage.setItem(
          key,
          JSON.stringify({ version: 2, data: { best, bestCombo, rounds: 1 } }),
        );
      },
      { key: saveKey, best: scenario.best, bestCombo: scenario.bestCombo },
    );
    await ready(page, true);
    await page.locator('#play').click();
    // 판 준비만 합성 입력으로 진행한다. 마지막 실패 입력은 실제 마우스·터치다.
    await page.evaluate(
      ({ perfects, ordinary, settleMs }) => {
        const debug = window.__COIN_TOWER__!;
        const canvas = document.querySelector('#game canvas')!;
        const offsets = [
          0,
          ...Array<number>(perfects).fill(0),
          ...Array.from({ length: ordinary }, (_, i) =>
            i % 2 === 0 ? 35 : -35,
          ),
        ];
        for (const offset of offsets) {
          const run = debug.snapshot();
          debug.advance(
            (Math.abs(run.activeX - run.targetX - offset) / run.speed) * 1000,
          );
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
      },
      { ...scenario, settleMs: rules.settleMs },
    );
    await place(page, info, 100);
    const score = 1 + scenario.perfects + scenario.ordinary;
    const best = Math.max(scenario.best, score);
    const bestCombo = Math.max(scenario.bestCombo, scenario.perfects);
    await expect(page.locator('#result-score')).toHaveText(String(score));
    await expect(page.locator('#result-best')).toHaveText(String(best));
    await expect(page.locator('#result-combo')).toHaveText(
      `x${scenario.perfects}`,
    );
    await expect(page.locator('#result-best-combo')).toHaveText(
      `x${bestCombo}`,
    );
    await expect(page.locator('#new-best-coins')).toBeVisible({
      visible: scenario.newCoins,
    });
    await expect(page.locator('#new-best-combo')).toBeVisible({
      visible: scenario.newCombo,
    });
    await advance(page, 5000);
    await expect(page.locator('#new-best-combo')).toBeVisible({
      visible: scenario.newCombo,
    });
    if (scenario.perfects === 12 && scenario.newCombo) {
      await page.screenshot({
        path: info.outputPath('result-combo-only.png'),
        fullPage: true,
      });
    }
    if (scenario.perfects === 100) {
      for (const viewport of [
        { width: 360, height: 640 },
        { width: 390, height: 844 },
        { width: 821, height: 462 },
      ]) {
        await page.setViewportSize(viewport);
        const panel = (await page.locator('.result-stats').boundingBox())!;
        const heading = (await page.locator('.result-heading').boundingBox())!;
        const reward = (await page.locator('.shard-reward').boundingBox())!;
        const actions = (await page.locator('.result-actions').boundingBox())!;
        expect(heading.y + heading.height).toBeLessThan(panel.y);
        expect(panel.y + panel.height).toBeLessThan(reward.y);
        expect(reward.y + reward.height).toBeLessThan(actions.y);
        expect(
          await page
            .locator('.result-stats')
            .evaluate((el) =>
              [
                ...el.querySelectorAll<HTMLElement>('strong, .record-badge'),
              ].every((cell) => cell.scrollWidth <= cell.clientWidth),
            ),
        ).toBe(true);
        await page.screenshot({
          path: info.outputPath(`records-result-${viewport.width}.png`),
          fullPage: true,
        });
      }
    }
    await page.locator('#home').click();
    await expect(page.locator('#title-best')).toHaveText(String(best));
    await expect(page.locator('#title-best-combo')).toHaveText(`x${bestCombo}`);
    await expect(page.locator('#new-best-coins')).toBeHidden();
    await expect(page.locator('#new-best-combo')).toBeHidden();
    if (scenario.perfects === 100) {
      for (const viewport of [
        { width: 360, height: 640 },
        { width: 821, height: 462 },
      ]) {
        await page.setViewportSize(viewport);
        // Phaser의 비동기 FIT 리사이즈가 HTML 레이아웃을 따라온 뒤 아트 경계를 읽는다.
        await expect
          .poll(async () => {
            const canvas = (await page.locator('#game canvas').boundingBox())!;
            const surface = (await page.locator('#surface').boundingBox())!;
            return Math.abs(canvas.height - surface.height);
          })
          .toBeLessThan(1);
        const cards = (await page.locator('.title-records').boundingBox())!;
        const canvas = (await page.locator('#game canvas').boundingBox())!;
        expect(cards.y + cards.height).toBeLessThan(
          canvas.y + (canvas.height * 552.5) / rules.height,
        );
        const columns = await page
          .locator('.title-record-columns .stat-readout')
          .all();
        const left = (await columns[0]!.boundingBox())!;
        const right = (await columns[1]!.boundingBox())!;
        expect(left.width).toBeCloseTo(right.width, 1);
        expect(left.height).toBeCloseTo(right.height, 1);
        expect(
          await page
            .locator('.title-record-columns')
            .evaluate((el) =>
              [...el.querySelectorAll<HTMLElement>('strong')].every(
                (cell) => cell.scrollWidth <= cell.clientWidth,
              ),
            ),
        ).toBe(true);
        await page.screenshot({
          path: info.outputPath(`records-menu-${viewport.width}.png`),
          fullPage: true,
        });
      }
      await page.reload();
      await expect(page.locator('#title-best')).toHaveText('101');
      await expect(page.locator('#title-best-combo')).toHaveText('x100');
    }
  }
  expect(errors).toEqual([]);
});

test('single Perfect result and both new records survive menu and reload without debug hooks', async ({
  page,
}, info) => {
  await ready(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  // Phaser의 초기 프레임 보정에 고정 대기 시간을 맞추지 않고 실제 단계 종료를 기다린다.
  const finishDrop = async () => {
    for (let frame = 0; frame < 120; frame++) {
      if (
        (await page.locator('#surface').getAttribute('data-phase')) === 'moving'
      )
        return;
      await page.clock.runFor(16);
    }
    throw new Error('Drop did not finish within 120 controlled frames');
  };
  await page.locator('#play').click();
  await tapGame(page, info);
  await finishDrop();
  await expect(page.locator('#score')).toHaveText('1');
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await page.clock.runFor(1250);
  await tapGame(page, info);
  await finishDrop();
  await expect(page.locator('#score')).toHaveText('2');
  await expect(page.locator('#surface')).toHaveAttribute(
    'data-phase',
    'moving',
  );
  await expectComboArt(page, 1);
  await page.screenshot({
    path: info.outputPath('production-ready-combo-x1.png'),
    fullPage: true,
  });
  await page.clock.runFor(300);
  await tapGame(page, info);
  await page.clock.runFor(720);
  await expect(page.locator('#result-combo')).toHaveText('x1');
  await expect(page.locator('#result-best-combo')).toHaveText('x1');
  await expect(page.locator('#new-best-coins')).toBeVisible();
  await expect(page.locator('#new-best-combo')).toBeVisible();
  await page.locator('#home').click();
  await expect(page.locator('#title-best')).toHaveText('2');
  await expect(page.locator('#title-best-combo')).toHaveText('x1');
  await page.reload();
  await expect(page.locator('#title-best-combo')).toHaveText('x1');
  expect(await page.evaluate(() => window.__COIN_TOWER__)).toBeUndefined();
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
  await page.route('**/assets/coin-tower/coin.webp', (route) => route.abort());
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
