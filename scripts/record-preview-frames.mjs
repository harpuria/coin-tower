// CrazyGames 프리뷰 영상용 프레임을 캡처한다.
// 사용: `npm run dev:crazygames -- --port 5191` 실행 후
//   node scripts/record-preview-frames.mjs <landscape|portrait> <출력 폴더> [URL]
// 게임 시간을 프레임마다 정확히 40ms(25fps)씩 진행해 정상 속도로 기록한다.
// 점수·속도·판정은 바꾸지 않고, 읽기 전용 snapshot으로 위치를 보고 Space만 입력한다.
/* global console, process, window, document, localStorage, requestAnimationFrame */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [
  kind = 'landscape',
  out = 'preview-frames',
  url = 'http://localhost:5191/?debug',
] = process.argv.slice(2);
const viewport =
  kind === 'portrait'
    ? { width: 1080, height: 1620 }
    : { width: 1920, height: 1080 };
const frameMs = 40;
const stopAt = Number(process.env.STOP_AT ?? 26);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
// 녹화에는 실제 SDK 대신 local 환경의 최소 통제 객체를 사용한다.
await page.route('https://sdk.crazygames.com/crazygames-sdk-v3.js', (route) =>
  route.fulfill({
    contentType: 'application/javascript',
    body: `window.CrazyGames={SDK:{init:async()=>{},environment:'local',game:{settings:{muteAudio:false},gameplayStart(){},gameplayStop(){},loadingStart(){},loadingStop(){},happytime(){},addSettingsChangeListener(){},removeSettingsChangeListener(){}}}};`,
  }),
);
// 첫 플레이 힌트를 마친 일반 플레이어 상태로 시작한다. 기록·재화는 기본값이다.
await page.addInitScript(() => {
  localStorage.setItem(
    'coin-tower-web-v1:save',
    JSON.stringify({
      version: 5,
      data: {
        best: 0,
        bestCombo: 0,
        rounds: 0,
        shards: 0,
        ownedSkins: ['gold'],
        equippedSkin: 'gold',
        onboardingComplete: true,
      },
    }),
  );
});
await page.goto(url);
await page.addStyleTag({
  content:
    '*{cursor:none!important} :focus,:focus-visible{outline:none!important}',
});
await page.locator('#play').waitFor({ state: 'visible' });
await page.waitForFunction(() => !document.querySelector('#play').disabled);
await page.waitForFunction(() => !!window.__COIN_TOWER__);
await page.waitForTimeout(800);
await page.evaluate(() => window.__COIN_TOWER__.freeze(true));
await page.locator('#play').click();

// 사람처럼 대부분 중앙을 노리되 가끔 조금 빗나가 NICE도 섞는다.
const offsets = [
  0, 0, 0, 0, 22, 0, 0, 0, 0, 0, -26, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, -20, 0,
  0, 0,
];
const log = [];
let frame = 0;
for (;;) {
  const before = await page.evaluate(() => window.__COIN_TOWER__.snapshot());
  if (before.mode !== 'playing' || before.score >= stopAt) break;
  const offset = offsets[before.score] ?? 0;
  // 한 프레임 안을 2ms 단위로 진행하며 목표 위치를 지나는 순간 Space를 누른다.
  let elapsed = 0;
  while (elapsed < frameMs) {
    const run = await page.evaluate(() => window.__COIN_TOWER__.snapshot());
    if (
      run.phase === 'moving' &&
      run.countdownMs === 0 &&
      Math.abs(run.activeX - (run.targetX + offset)) <= (run.speed * 2) / 1000
    ) {
      await page.keyboard.press('Space');
    }
    await page.evaluate(() => window.__COIN_TOWER__.advance(2));
    elapsed += 2;
  }
  // RAF 기반 HTML 연출(콤보·이정표·주변 배경)이 같은 상태를 그리도록 한 프레임 기다린다.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
  );
  const run = await page.evaluate(() => window.__COIN_TOWER__.snapshot());
  await page.screenshot({
    path: `${out}/${String(frame).padStart(5, '0')}.png`,
  });
  log.push({
    frame,
    score: run.score,
    combo: run.combo,
    feedback: run.feedback,
    milestone: run.milestoneRemaining > 0 ? run.milestone : 0,
    background: run.background,
  });
  frame++;
}
console.log(JSON.stringify({ frames: frame, errors, final: log.at(-1) }));
const { writeFileSync } = await import('node:fs');
writeFileSync(`${out}/frames.json`, JSON.stringify(log));
await browser.close();
