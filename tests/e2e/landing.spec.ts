import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { rules } from '../../src/game/rules';

const snapshot = (page: Page) =>
  page.evaluate(() => window.__COIN_TOWER__!.snapshot());
const advance = (page: Page, ms: number) =>
  page.evaluate((delta) => window.__COIN_TOWER__!.advance(delta), ms);

async function dropAt(page: Page, info: TestInfo, offset: number) {
  const run = await snapshot(page);
  const target = run.targetX + offset;
  // 각 동전의 생성 직후에 호출하므로 중앙 목표까지 반전 없이 이동한다.
  await advance(page, (Math.abs(run.activeX - target) / run.speed) * 1000);
  expect((await snapshot(page)).activeX).toBeCloseTo(target, 6);
  if (info.project.name === 'mobile') await page.locator('#game canvas').tap();
  else if (offset < 0) await page.keyboard.press('Space');
  else await page.locator('#game canvas').click();
  expect((await snapshot(page)).phase).toBe('dropping');
  await advance(page, Math.ceil((rules.spawnGap / rules.fallSpeed) * 1000));
}

test('45 percent landing boundaries and unchanged Perfect use real input', async ({
  page,
}, info) => {
  test.skip(
    process.env.E2E_PREVIEW === '1',
    'precise boundaries use development time control',
  );
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?debug');
  await expect(page.locator('#play')).toBeEnabled();
  await expect
    .poll(() => page.evaluate(() => !!window.__COIN_TOWER__))
    .toBe(true);
  await page.evaluate(() => window.__COIN_TOWER__!.freeze(true));
  const cases = [
    { fraction: 0.35, expected: 'nice', label: 'overlap-65-percent' },
    { fraction: 0.45, expected: 'nice', label: 'success-boundary' },
    { fraction: 0.4501, expected: 'miss', label: 'outside-success' },
    { fraction: 0.1, expected: 'perfect', label: 'perfect-boundary' },
    { fraction: 0.1001, expected: 'nice', label: 'outside-perfect' },
  ] as const;
  for (const side of [-1, 1]) {
    for (const scenario of cases) {
      const mode = (await snapshot(page)).mode;
      if (mode === 'menu') await page.locator('#play').click();
      else if (mode === 'result') await page.locator('#retry').click();
      else {
        await page.locator('#pause').click();
        await page.locator('#restart').click();
        await page.locator('#confirm-yes').click();
      }
      expect((await snapshot(page)).score).toBe(0);
      await dropAt(page, info, 0);
      expect((await snapshot(page)).feedback).toBe('nice');
      expect((await snapshot(page)).combo).toBe(0);
      await advance(page, rules.settleMs);
      const x = (await snapshot(page)).targetX;
      await dropAt(page, info, side * rules.diameter * scenario.fraction);
      const landed = await snapshot(page);
      expect(landed.activeX).toBeCloseTo(x + side * 166 * scenario.fraction, 6);
      if (scenario.expected === 'miss') {
        expect(landed.mode).toBe('result');
        expect(landed.score).toBe(1);
        await expect(page.locator('#result-score')).toHaveText('1');
      } else {
        expect(landed.mode).toBe('playing');
        expect(landed.score).toBe(2);
        expect(landed.phase).toBe('settling');
        expect(landed.feedback).toBe(scenario.expected);
        expect(landed.targetX).toBeCloseTo(landed.activeX, 6);
        expect(landed.combo).toBe(scenario.expected === 'perfect' ? 1 : 0);
        await expect(page.locator('#score')).toHaveText('2');
      }
      await page.screenshot({
        path: info.outputPath(`landing-${side}-${scenario.label}.png`),
      });
    }
  }
  expect(errors).toEqual([]);
});
