import { expect, type Page } from '@playwright/test';

/** 세로 화면에서는 조작 아이콘이 위 요소 아래에 있고, 넓은 창에서는 플레이 기둥 밖 측면에 있다. */
export async function expectUtilityClear(
  page: Page,
  above: { y: number; height: number },
) {
  // 창 크기를 바꾼 직후에는 다음 렌더 프레임에 조작 아이콘이 측면·기둥으로 옮겨진다.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          matchMedia('(min-aspect-ratio: 4/3)').matches ===
          !!document.querySelector('#side-controls .utility'),
      ),
    )
    .toBe(true);
  await expect(page.locator('.utility')).toBeVisible();
  const surface = (await page.locator('#surface').boundingBox())!;
  const utility = (await page.locator('.utility').boundingBox())!;
  if (utility.x >= surface.x + surface.width - 1) return;
  expect(above.y + above.height).toBeLessThanOrEqual(utility.y);
}
