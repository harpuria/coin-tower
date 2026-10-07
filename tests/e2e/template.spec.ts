import { expect, test } from '@playwright/test';
import { gameConfig } from '../../src/config/game';

test('mouse/touch play, pause, settings, save, restart, and menu navigation', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // `?round=4` shortens the demo round so the full flow runs in seconds.
  await page.goto('/?round=4');
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('#mode-label')).toHaveText('MENU');
  // The canvas exists before preload ends; wait for actual UI readiness.
  await expect(page.getByRole('button', { name: '플레이 시작' })).toBeEnabled();
  await page.getByRole('button', { name: '플레이 시작' }).click();
  await expect(page.locator('#mode-label')).toHaveText('PLAYING');
  await page.getByRole('button', { name: '일시정지', exact: true }).click();
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.getByRole('button', { name: '설정 열기' }).click();
  await page.getByLabel('전체 음소거', { exact: true }).check();
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.getByRole('button', { name: '계속하기' }).click();
  await expect(page.locator('#pause-overlay')).toBeHidden();
  const canvas = page.locator('#game canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  const targetX =
    box.x + (box.width * (gameConfig.width / 2 + 110)) / gameConfig.width;
  const targetY = box.y + box.height / 2;
  // Hold the input until the round ends. Round time and movement both use game
  // time, so a slow runner (where Phaser clamps frame delta) cannot miss the
  // star the way a fixed real-time hold could.
  const roundEnds = () =>
    expect(page.locator('#mode-label')).toHaveText('RESULT', {
      timeout: 20_000,
    });
  if (testInfo.project.name === 'mobile') {
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        {
          x: targetX,
          y: targetY,
        },
      ],
    });
    await roundEnds();
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await touch.detach();
  } else {
    await page.mouse.move(targetX, targetY);
    await page.mouse.down();
    await roundEnds();
    await page.mouse.up();
  }
  await expect(page.locator('#best')).not.toHaveText('0');
  await expect(page.locator('#rounds')).toHaveText('1');
  await page.screenshot({
    path: testInfo.outputPath('result.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: '다시 플레이' }).click();
  await expect(page.locator('#mode-label')).toHaveText('PLAYING');
  await page.getByRole('button', { name: '메뉴', exact: true }).click();
  await expect(page.locator('#mode-label')).toHaveText('MENU');
  await page.reload();
  await expect(page.locator('#rounds')).toHaveText('1');
  await page.getByRole('button', { name: '설정 열기' }).click();
  await expect(page.getByLabel('전체 음소거', { exact: true })).toBeChecked();
  expect(errors).toEqual([]);
});

test('service gates and responsive layout', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: '보상형 광고 테스트' }).click();
  await expect(page.getByRole('status')).toContainText('unavailable');
  await expect(page.getByLabel('Mock 분석·광고 동의')).toBeHidden();
  await expect(page.getByLabel('Mock 결과')).toBeHidden();
  await page.getByRole('button', { name: '구매 테스트' }).click();
  await expect(page.getByRole('status')).toContainText('unavailable');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const canvas = (await page.locator('#game canvas').boundingBox())!;
  expect(canvas.width / canvas.height).toBeCloseTo(720 / 1280, 2);
  await page.screenshot({
    path: testInfo.outputPath('menu.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test('corrupt data remains intact until explicit reset', async ({ page }) => {
  await page.goto('/');
  const saveKey = `${gameConfig.storagePrefix}:save`;
  await page.evaluate((key) => localStorage.setItem(key, 'broken'), saveKey);
  await page.reload();
  await expect(page.locator('#storage-status')).toContainText('corrupt');
  await page.getByRole('button', { name: '설정 열기' }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), saveKey)).toBe(
    'broken',
  );
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: '플레이 기록 초기화', exact: true })
    .click();
  await expect(page.locator('#storage-status')).toContainText('자동으로 저장');
});

test('asset failure keeps the game disabled and shows recovery instructions', async ({
  page,
}) => {
  await page.route('**/assets/demo/star.svg', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText(
    '파일을 불러오지 못했습니다',
  );
  await expect(
    page.getByRole('button', { name: '플레이 시작' }),
  ).toBeDisabled();
});

test('manual pause toggles independently and fullscreen is offered', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Escape needs a keyboard');
  await page.goto('/');
  await page.getByRole('button', { name: '플레이 시작' }).click();
  await expect(page.locator('#mode-label')).toHaveText('PLAYING');
  await page.locator('#game').focus();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '계속하기' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-overlay')).toBeHidden();
  await page.getByRole('button', { name: '전체화면' }).click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.id))
    .toBe('stage');
  await page.getByRole('button', { name: '전체화면 나가기' }).click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement))
    .toBeNull();
});

test('uncaught errors show a recovery screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '플레이 시작' })).toBeEnabled();
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error('demo failure');
    });
  });
  await expect(page.getByRole('alert')).toContainText('demo failure');
  await expect(page.getByRole('button', { name: '새로고침' })).toBeVisible();
});
