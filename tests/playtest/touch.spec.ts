import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { rules } from '../../src/game/rules';

type TouchSample = {
  pointerType: string;
  before: string;
  after: string;
  handlerMs: number;
  rafMs?: number;
};
declare global {
  interface Window {
    __touchSamples?: TouchSample[];
  }
}

test('observe touch and Perfect at 5, 10, and 20 successful coins', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?debug');
  await expect(page.locator('#play')).toBeEnabled();
  await page.evaluate(() => window.__COIN_TOWER__!.freeze(true));
  await page.locator('#play').tap();
  const canvas = (await page.locator('#game canvas').boundingBox())!;
  const scale = canvas.width / rules.width;
  const touch = {
    x: canvas.x + canvas.width * 0.2,
    y: canvas.y + canvas.height * 0.8,
  };

  await page.evaluate(() => {
    window.__touchSamples = [];
    const pending = new WeakMap<
      PointerEvent,
      { before: string; start: number }
    >();
    window.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.isTrusted || !(event.target instanceof HTMLCanvasElement))
          return;
        pending.set(event, {
          before: window.__COIN_TOWER__!.snapshot().phase,
          start: performance.now(),
        });
      },
      { capture: true },
    );
    // 버블 단계에서 게임 입력 핸들러 이후의 상태를 읽는다.
    window.addEventListener('pointerdown', (event) => {
      const entry = pending.get(event);
      if (!entry) return;
      const sample: TouchSample = {
        pointerType: event.pointerType,
        before: entry.before,
        after: window.__COIN_TOWER__!.snapshot().phase,
        handlerMs: performance.now() - entry.start,
      };
      window.__touchSamples!.push(sample);
      requestAnimationFrame(() => {
        sample.rafMs = performance.now() - entry.start;
      });
    });
  });

  const observations = [];
  for (const score of [5, 10, 20]) {
    // 준비는 시간 제어와 합성 입력을 쓰고, 관측 대상은 네이티브 터치로 입력한다.
    await page.evaluate(
      ({ score, settleMs }) => {
        const debug = window.__COIN_TOWER__!;
        const canvas = document.querySelector('canvas')!;
        while (debug.snapshot().score < score) {
          const state = debug.snapshot();
          debug.advance(
            (Math.abs(state.activeX - state.targetX) / state.speed) * 1000,
          );
          canvas.dispatchEvent(
            new PointerEvent('pointerdown', {
              bubbles: true,
              isPrimary: true,
              button: 0,
              pointerType: 'touch',
            }),
          );
          debug.advance(1000);
          debug.advance(settleMs);
          if (debug.snapshot().mode !== 'playing')
            throw new Error('playtest preparation failed');
        }
      },
      { score, settleMs: rules.settleMs },
    );

    const checkpoint = await page.evaluate(() =>
      window.__COIN_TOWER__!.snapshot(),
    );
    expect(checkpoint.score).toBe(score);
    await page
      .locator('#surface')
      .screenshot({ path: info.outputPath(`${score}-moving-perfect.png`) });

    const firstCenterMs = (rules.laneHalfWidth / checkpoint.speed) * 1000;
    await page.evaluate(
      (ms) => window.__COIN_TOWER__!.advance(ms),
      firstCenterMs,
    );
    await page.locator('#surface').screenshot({
      path: info.outputPath(`${score}-center-pass.png`),
    });

    // 실시간으로 한 왕복을 관측한다. 이 호스트의 에뮬레이션 측정값이다.
    const live = await page.evaluate(async (laneSpan) => {
      const debug = window.__COIN_TOWER__!;
      const speed = debug.snapshot().speed;
      const duration = ((laneSpan * 2) / speed) * 1000 + 100;
      debug.freeze(false);
      const start = performance.now();
      const frames: number[] = [];
      let previous = start;
      await new Promise<void>((resolve) => {
        const tick = () => {
          const now = performance.now();
          frames.push(now - previous);
          previous = now;
          if (now - start >= duration) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      debug.freeze(true);
      return { wallMs: performance.now() - start, frames };
    }, rules.laneHalfWidth * 2);

    // 반전 뒤에도 다음 중앙 통과까지 진행해 터치 처리와 위치 고정을 관측한다.
    await page.evaluate((laneHalfWidth) => {
      const debug = window.__COIN_TOWER__!;
      const state = debug.snapshot();
      const ahead = (state.targetX - state.activeX) * state.direction;
      const distance = ahead >= 0 ? ahead : laneHalfWidth * 2 + ahead;
      debug.advance((distance / state.speed) * 1000);
    }, rules.laneHalfWidth);
    await page.touchscreen.tap(touch.x, touch.y);
    const dropped = await page.evaluate(() =>
      window.__COIN_TOWER__!.snapshot(),
    );
    expect(dropped.phase).toBe('dropping');
    expect(dropped.activeX).toBeCloseTo(dropped.targetX);
    await page.evaluate(() => window.__COIN_TOWER__!.advance(80));
    await page.touchscreen.tap(touch.x, touch.y);
    await page.evaluate(() => window.__COIN_TOWER__!.advance(1000));
    const landed = await page.evaluate(() => window.__COIN_TOWER__!.snapshot());
    expect(landed.score).toBe(score + 1);
    expect(landed.feedback).toBe('perfect');
    await page
      .locator('#surface')
      .screenshot({ path: info.outputPath(`${score}-landing-perfect.png`) });
    await page.evaluate(
      (ms) => window.__COIN_TOWER__!.advance(ms),
      rules.settleMs,
    );
    expect(
      await page.evaluate(() => window.__COIN_TOWER__!.snapshot().phase),
    ).toBe('moving');
    await page.locator('#surface').screenshot({
      path: info.outputPath(`${score}-next-moving-perfect.png`),
    });
    const samples = await page.evaluate(() => window.__touchSamples!.splice(0));
    expect(samples).toHaveLength(2);
    expect(
      samples.map((sample) => [
        sample.pointerType,
        sample.before,
        sample.after,
      ]),
    ).toEqual([
      ['touch', 'moving', 'dropping'],
      ['touch', 'dropping', 'dropping'],
    ]);
    const frames = [...live.frames].sort((a, b) => a - b);
    observations.push({
      successfulCoins: score,
      speed: checkpoint.speed,
      oneWayMs: ((rules.laneHalfWidth * 2) / checkpoint.speed) * 1000,
      perfectWindowMs:
        ((rules.diameter * rules.perfectFraction * 2) / checkpoint.speed) *
        1000,
      successWindowMs:
        ((rules.diameter * rules.successFraction * 2) / checkpoint.speed) *
        1000,
      displayedCoinWidthCssPx: rules.diameter * scale,
      perfectImageCssPx: { width: 320 * scale, height: 160 * scale },
      minimumVerticalGapCssPx:
        (rules.height * rules.targetFraction -
          rules.spawnGap -
          51 -
          (330 + 80)) *
        scale,
      feedbackAfterSettleMs: rules.feedbackMs - rules.settleMs,
      firstCenterMs,
      feedbackOverlapsFirstCenterPassMs: Math.max(
        0,
        rules.feedbackMs - rules.settleMs - firstCenterMs,
      ),
      touchPoint: touch,
      touches: samples,
      live: {
        wallMs: live.wallMs,
        frames: live.frames.length,
        medianFrameMs: frames[Math.floor(frames.length * 0.5)],
        p95FrameMs: frames[Math.floor(frames.length * 0.95)],
      },
    });
  }
  expect(errors).toEqual([]);
  const report = {
    project: info.project.name,
    viewport: page.viewportSize(),
    canvas,
    method:
      'Scripted checkpoint preparation; live movement observation; native touch at frozen exact center. Handler/RAF timings exclude hardware and OS latency. Perfect streak is scripted, not a natural frequency.',
    observations,
    runtimeErrors: errors,
  };
  await writeFile(
    info.outputPath('observations.json'),
    JSON.stringify(report, null, 2),
  );
  await info.attach('observations', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
});
