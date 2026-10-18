import { writeFile } from 'node:fs/promises';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { gameConfig } from '../../src/config/game';
import { moveSpeed, rules } from '../../src/game/rules';
import { skins, type SkinId } from '../../src/game/skins';
import { crazyGamesSdkUrl } from '../../src/services/crazygames';

const preview = process.env.E2E_PREVIEW === '1';
const saveKey = `${gameConfig.storagePrefix}:save`;
const frames = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 821, height: 462 },
  { width: 907, height: 510 },
];

async function activate(page: Page, info: TestInfo, selector: string) {
  if (info.project.name === 'mobile') await page.locator(selector).tap();
  else await page.locator(selector).click();
}

async function prepare(
  page: Page,
  skin: SkinId,
  crazygames: boolean,
  reducedMotion = false,
) {
  if (crazygames)
    await page.route(crazyGamesSdkUrl, (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.CrazyGames={SDK:{init:async()=>{},environment:'local',game:{settings:{muteAudio:false},gameplayStart:()=>{},gameplayStop:()=>{},addSettingsChangeListener:()=>{},removeSettingsChangeListener:()=>{}}}};`,
      }),
    );
  await page.addInitScript(
    ({ key, skin, reducedMotion }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 5,
          data: {
            best: 32,
            bestCombo: 8,
            rounds: 3,
            shards: 1000,
            ownedSkins: ['gold', 'silver', 'ruby', 'emerald'],
            equippedSkin: skin,
            onboardingComplete: true,
          },
        }),
      );
      localStorage.setItem(
        key.replace(':save', ':settings'),
        JSON.stringify({
          version: 1,
          data: {
            muted: false,
            master: 0.7,
            music: 0.35,
            sfx: 0.6,
            reducedMotion,
          },
        }),
      );
    },
    { key: saveKey, skin, reducedMotion },
  );
  await page.goto(preview ? '/' : '/?debug');
  await expect(page.locator('#play')).toBeEnabled();
  if (preview) {
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    expect(await page.evaluate(() => window.__COIN_TOWER__)).toBeUndefined();
  } else {
    await expect
      .poll(() => page.evaluate(() => !!window.__COIN_TOWER__))
      .toBe(true);
    await page.evaluate(() => window.__COIN_TOWER__!.freeze(true));
  }
}

function controls(page: Page, info: TestInfo) {
  const advance = (ms: number) =>
    preview
      ? page.clock.runFor(ms)
      : page.evaluate((ms) => window.__COIN_TOWER__!.advance(ms), ms);
  const feedback = () => page.evaluate(() => window.__COIN_TOWER__!.feedback());
  async function land(score: number, offset = 0) {
    if (preview) await advance((232 / moveSpeed(score)) * 1000);
    else {
      const run = await page.evaluate(() => window.__COIN_TOWER__!.snapshot());
      await advance(
        (Math.abs(run.activeX - run.targetX - offset) / run.speed) * 1000,
      );
    }
    await activate(page, info, '#game canvas');
    await advance(preview ? 250 : 1000);
    if (preview) {
      for (let frame = 0; frame < 4; frame++) {
        if (
          (await page.locator('#surface').getAttribute('data-phase')) !==
          'dropping'
        )
          break;
        await advance(16);
      }
    }
    await expect(page.locator('#score')).toHaveText(String(score + 1));
    await expect(page.locator('#surface')).toHaveAttribute(
      'data-phase',
      'settling',
    );
  }
  async function next() {
    // 16ms까지의 RAF 양자화도 포함하되 이동 시간을 다음 배치에 누적하지 않는다.
    await advance(rules.settleMs);
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
  return { advance, feedback, land, next };
}

/** 실제 낙하 입력과 모델/브라우저 시간으로 연출 프레임을 관측한다. */
export function perfectCases(crazygames = false) {
  test.use({ trace: 'off' });
  for (const skin of skins) {
    test(`perfect: ${skin.id} palette, backgrounds, high stacks and interruptions`, async ({
      page,
    }, info) => {
      test.setTimeout(900_000);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.url().includes('/assets/') && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      await prepare(page, skin.id, crazygames);
      const { advance, feedback, land, next } = controls(page, info);
      await activate(page, info, '#play');
      const observations: unknown[] = [];
      // 배포본에는 NICE가 섞일 수 있어 배경별 실제 Perfect를 별도로 모은다.
      const limit = !preview || skin.id === 'emerald' ? 101 : 36;
      const checkpoints = [2, 10, 12, 20, 22, 30, 32, 40, 60, 101];
      const perfectBackgrounds = new Set<string>();
      let smallFramesCaptured = false;
      for (let score = 0; score < limit; score++) {
        await land(score);
        const isPerfect =
          score > 0 && (await page.locator('#combo').isVisible());
        const background = ['morning', 'noon', 'evening', 'night'][
          Math.floor((score + 1) / 10) % 4
        ]!;
        const stable = (score + 1) % 10 >= 2;
        const newBackground =
          isPerfect && stable && !perfectBackgrounds.has(background);
        const needsFrames =
          !smallFramesCaptured &&
          isPerfect &&
          (preview ? score + 1 >= limit - 4 : score + 1 === limit);
        if (
          checkpoints.includes(score + 1) ||
          newBackground ||
          needsFrames ||
          score + 1 === limit
        ) {
          if (isPerfect && stable) perfectBackgrounds.add(background);
          await advance(50);
          let observed;
          if (!preview) {
            const frame = await feedback();
            expect(frame.coin!.texture).toBe(skin.texture);
            expect(frame.particles.visible).toBe(true);
            expect(frame.particles.commands).toContain(
              skin.perfectPalette.color,
            );
            expect(frame.particles.commands).toContain(
              skin.perfectPalette.highlight,
            );
            const run = await page.evaluate(() =>
              window.__COIN_TOWER__!.snapshot(),
            );
            expect(frame.particles.scale).toBe(run.zoom);
            expect(frame.particles.x).toBeCloseTo(360 * (1 - run.zoom));
            expect(frame.particles.y).toBeCloseTo(896 * (1 - run.zoom));
            observed = {
              run,
              frame,
              background: await page.evaluate(() =>
                window.__COIN_TOWER__!.background(),
              ),
            };
          } else
            observed = {
              score: score + 1,
              combo: await page.locator('#combo-count').textContent(),
              kind: isPerfect ? 'perfect' : 'nice',
              background,
              stable,
            };
          observations.push(observed);
          await page.screenshot({
            path: info.outputPath(
              `${skin.id}-${score + 1}-${isPerfect ? 'burst' : 'nice'}.png`,
            ),
            fullPage: true,
          });
          if (score === 1) {
            const held = !preview ? await feedback() : null;
            await activate(page, info, '#pause');
            await advance(1000);
            await expect(page.locator('#combo')).toBeHidden();
            if (held) {
              expect((await feedback()).remainingMs).toBe(held.remainingMs);
              expect((await feedback()).particles.visible).toBe(false);
            }
            await activate(page, info, '#continue');
            await advance(preview ? 3008 : 3000);
            if (held) expect(await feedback()).toEqual(held);
            await activate(page, info, '#mute');
            await expect(page.locator('#mute')).toHaveAttribute(
              'aria-pressed',
              'true',
            );
          }
          let resizeElapsed = 0;
          if (needsFrames) {
            smallFramesCaptured = true;
            if (!preview)
              await expect(page.locator('#combo-count')).toHaveText('x100');
            for (const viewport of frames) {
              await page.setViewportSize(viewport);
              if (preview) {
                await advance(16);
                resizeElapsed += 16;
              }
              await expect
                .poll(async () => {
                  const canvas = (await page
                    .locator('#game canvas')
                    .boundingBox())!;
                  const surface = (await page
                    .locator('#surface')
                    .boundingBox())!;
                  return Math.abs(canvas.height - surface.height);
                })
                .toBeLessThan(1);
              await page.screenshot({
                path: info.outputPath(
                  `${skin.id}-${score + 1}-${viewport.width}.png`,
                ),
                fullPage: true,
              });
              expect(
                await page.evaluate(
                  () => document.documentElement.scrollWidth <= innerWidth,
                ),
              ).toBe(true);
            }
          }
          // 이동 중인 별빛 대신 동전 윤곽에 남는 후반 프레임도 비교한다.
          await advance(90 - resizeElapsed);
          await page.screenshot({
            path: info.outputPath(`${skin.id}-${score + 1}-afterglow.png`),
            fullPage: true,
          });
          await advance(110);
          if (!preview) {
            expect((await feedback()).particles.visible).toBe(false);
            expect((await feedback()).particles.commands.length).toBeLessThan(
              10,
            );
            await expect(page.locator('#surface')).toHaveAttribute(
              'data-phase',
              'settling',
            );
          }
          await advance(30);
          if (
            preview &&
            (await page.locator('#surface').getAttribute('data-phase')) !==
              'moving'
          )
            await advance(16);
        } else await next();
      }
      expect(smallFramesCaptured).toBe(true);
      expect([...perfectBackgrounds].sort()).toEqual([
        'evening',
        'morning',
        'night',
        'noon',
      ]);
      if (!preview) {
        await land(limit, 35);
        await advance(50);
        const nice = await feedback();
        expect(nice.particles.commands).not.toContain(
          skin.perfectPalette.color,
        );
        await expect(page.locator('#combo')).toBeHidden();
        await page.screenshot({
          path: info.outputPath(`${skin.id}-nice.png`),
          fullPage: true,
        });
      }
      await activate(page, info, '#pause');
      await activate(page, info, '#restart');
      await activate(page, info, '#confirm-yes');
      await advance(0);
      await expect(page.locator('#score')).toHaveText('0');
      await expect(page.locator('#combo')).toBeHidden();
      if (!preview) expect((await feedback()).particles.visible).toBe(false);
      const progress = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).data,
        saveKey,
      );
      expect(progress).toMatchObject({
        best: 32,
        bestCombo: 8,
        rounds: 3,
        shards: 1000,
        equippedSkin: skin.id,
      });
      expect(errors).toEqual([]);
      await writeFile(
        info.outputPath('perfect-observations.json'),
        JSON.stringify(observations, null, 2),
      );
    });
  }

  test('perfect: reduced motion keeps static skin-colored contact flashes', async ({
    page,
  }, info) => {
    test.setTimeout(180_000);
    await prepare(page, 'gold', crazygames, true);
    const { advance, land, next, feedback } = controls(page, info);
    for (const skin of skins) {
      if (skin.id !== 'gold') {
        await activate(page, info, '#skins-menu');
        await activate(page, info, `#skin-${skin.id}`);
        await activate(page, info, '#skins-back');
      }
      await activate(page, info, '#play');
      await land(0);
      await next();
      await land(1);
      await advance(50);
      if (!preview) {
        const frame = await feedback();
        expect(frame.coin!.texture).toBe(skin.texture);
        expect(frame.coin!.width).toBe(166);
        expect(frame.coin!.height).toBe(102);
        expect(frame.label.width).toBe(320);
        expect(frame.particles.commands).toContain(skin.perfectPalette.color);
        expect(frame.particles.commands.length).toBeLessThan(100);
      }
      await page.screenshot({
        path: info.outputPath(`${skin.id}-reduced-flash.png`),
        fullPage: true,
      });
      await advance(80);
      if (!preview) expect((await feedback()).particles.visible).toBe(false);
      await advance(200);
      await activate(page, info, '#pause');
      await activate(page, info, '#pause-home');
      await activate(page, info, '#confirm-yes');
      await expect(page.locator('#play')).toBeVisible();
      if (!preview) expect((await feedback()).particles.visible).toBe(false);
    }
  });
}
