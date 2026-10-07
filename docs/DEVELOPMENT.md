# 개발 안내

이 문서는 가져온 템플릿의 공통 기능 안내입니다. Coin Tower의 현재 설정은 세로 720×1280이며 외부 서비스·Mock은 비활성화되어 있습니다. 예제 실행 상태와 이식 범위는 [설정 기록](SETUP.md)을 참고합니다.

## 데모를 내 게임으로 바꾸기

예제(별 모으기)는 사용법을 보여주기 위한 것입니다. 아래 순서로 바꾸면 공통 기능을 그대로 쓰면서 데모를 걷어낼 수 있습니다.

| 순서 | 파일                         | 할 일                                                                                       |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| 1    | `src/config/game.ts`         | `title`, `storagePrefix`, 해상도, `pixelArt`, `orientation`, `startScene`, `pausableScenes` |
| 2    | `package.json`, `index.html` | package 이름, `<title>`·description·`theme-color`, `public/favicon.svg`                     |
| 3    | `src/game/assets.ts`         | `assetKeys`와 `queueAssets`를 내 asset으로 교체, `public/assets/demo/` 삭제                 |
| 4    | `src/game/save.ts`           | 저장 schema(처음이면 version 1부터)                                                         |
| 5    | `src/game/session.ts`        | 저장하지 않는 진행 상태(`Mode`, 점수 등)와 규칙 값                                          |
| 6    | `src/game/scenes.ts`         | 내 장면으로 교체. 파일을 나눠도 됩니다                                                      |
| 7    | `src/main.ts`                | `scene` 목록에 내 장면 등록(Boot, Preload는 맨 앞에 유지)                                   |
| 8    | `src/ui/Shell.ts`            | HTML 메뉴/HUD를 게임에 맞게 교체하거나 삭제(아래 참고)                                      |
| 9    | `tests/e2e/`                 | 데모 흐름 검사를 내 게임 흐름으로 교체. `tests/unit/`의 공통 검사는 유지                    |

**Shell을 삭제할 때**: Phaser가 들어갈 `<div id="game">`과 크기를 가진 부모를 `index.html`에 직접 만들고,
전체화면을 쓰면 `main.ts`의 `fullscreenTarget`(기본 `'stage'`)도 그 요소 id로 맞춥니다.
`app.onState`는 상태가 바뀔 때 호출되는 콜백이므로 HUD가 없으면 비워 둬도 됩니다.

## 새 장면 만들기

공통 서비스가 필요한 장면은 생성자로 `App`을 받습니다.

```ts
// src/game/MyGame.ts
import Phaser from 'phaser';
import type { App } from '../app';
import { MoveInput } from '../core/input';
import { assetKeys } from './assets';

export class MyGame extends Phaser.Scene {
  private controls!: MoveInput;
  private player!: Phaser.Physics.Arcade.Image;

  constructor(private app: App) {
    super('MyGame'); // gameConfig.startScene / pausableScenes 와 같은 이름
  }
  create() {
    this.player = this.physics.add.image(100, 100, assetKeys.player);
    this.controls = new MoveInput(this);
    this.app.audio?.playMusic(assetKeys.music);
    if (this.app.pause.paused) this.scene.pause(); // 일시정지 중에 시작된 경우
  }
  update() {
    const v = this.controls.move(this.player).scale(200);
    this.player.setVelocity(v.x, v.y);
  }
}
```

장면 전환은 `transition(this, 'Result', this.app.transitionMs)`를 씁니다. 중복 전환을 막고, 움직임 줄이기 설정이면 페이드를 생략합니다.

## 입력

`MoveInput`은 키보드(방향키·WASD), 게임패드(D-pad·왼쪽 스틱), 캔버스를 누른 지점 방향을 하나의 이동 벡터로 합칩니다.
키를 바꾸려면 두 번째 인자로 `MoveBindings`를 넘깁니다. HTML 버튼·슬라이더에 포커스가 있는 동안에는 키보드 입력을 무시합니다.
점프·확인 같은 버튼 입력은 같은 방식으로 `scene.input.keyboard.addKey()`와 `pad1.A` 등을 묶어 추가합니다.

## asset 추가

`src/game/assets.ts`의 `queueAssets`에서 Phaser loader를 사용하고, 키는 `assetKeys`에 모읍니다.
`load.setPath`에 `import.meta.env.BASE_URL`을 붙여 두었으므로 하위 경로 배포에서도 동작합니다.

```ts
load.spritesheet('hero', 'hero.png', { frameWidth: 32, frameHeight: 32 });
load.atlas('ui', 'ui.png', 'ui.json'); // TexturePacker 등에서 만든 atlas
load.bitmapFont('pixel', 'pixel.png', 'pixel.xml');
```

- 도트 그래픽이면 `gameConfig.pixelArt`를 `true`로 둡니다. 확대해도 흐려지지 않습니다.
- 웹 글꼴을 Phaser 텍스트에 쓰면 글꼴이 로드되기 전에 그려질 수 있습니다. `document.fonts.load('16px MyFont')`를 기다린 뒤 장면을 시작하거나 bitmap font를 씁니다.
- 필수 asset 하나라도 실패하면 Preload가 다음 장면으로 넘어가지 않고 안내를 띄웁니다.

## 저장 데이터와 migration

`src/game/save.ts`가 저장 schema의 원본입니다. 구조를 바꿀 때는 version을 올리고 이전 버전에서 한 단계씩 변환하는 migration을 추가합니다.
예: v1 `{ best, rounds }`에 v2 `coins`를 추가할 때

```ts
import { isRecord, type Schema } from '../core/store';

export interface Progress {
  best: number;
  rounds: number;
  coins: number;
}
const isCount = (n: unknown) =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const isV1 = (v: unknown): v is { best: number; rounds: number } =>
  isRecord(v) && isCount(v.best) && isCount(v.rounds);

export const progressSchema: Schema<Progress> = {
  version: 2,
  defaults: () => ({ best: 0, rounds: 0, coins: 0 }),
  validate: (v): v is Progress => isV1(v) && isCount((v as Progress).coins),
  migrations: {
    // 키는 "변환 전 버전". 실패하면 throw → 원본은 그대로 보호됩니다.
    1: (old) => {
      if (!isV1(old)) throw new Error('Invalid v1 save');
      return { ...old, coins: 0 };
    },
  },
};
```

schema를 바꿀 때마다 실제 구버전 데이터를 fixture로 넣은 검사를 `tests/unit/`에 추가합니다.

```ts
it('migrates a v1 save', () => {
  const storage = new MemoryStorage();
  storage.setItem('save', '{"version":1,"data":{"best":7,"rounds":3}}');
  const store = new Store(storage, 'save', progressSchema);
  expect(store.status).toBe('ready');
  expect(store.data).toEqual({ best: 7, rounds: 3, coins: 0 });
});
```

게임 코드에서는 이렇게 씁니다.

```ts
this.app.save.update((data) => ({ ...data, best: Math.max(data.best, score) }));
const persisted = this.app.save.flush(); // false면 "저장됨"이라고 표시하지 않습니다
```

- 매 프레임 쓰지 말고 판 종료처럼 중요한 순간에 `flush()`합니다. 나머지는 주기·탭 숨김 때 자동으로 저장됩니다.
- `reset()`은 원본을 지웁니다. 사용자가 확인한 경우에만 호출합니다.

## 오디오와 일시정지

- `app.audio?.playMusic(key)` / `sfx(key)` / `stopMusic()`. 음량·음소거 설정은 자동으로 적용됩니다.
- 브라우저 자동재생 제한 때문에 첫 소리는 사용자 클릭·터치 이후에 납니다. 메뉴의 버튼 동작에서 음악을 시작하세요.
- 인벤토리 같은 내 UI로 게임을 멈추려면 `app.pause.set('inventory', true)`, 닫을 때 같은 이유로 `false`를 넘깁니다.
  모든 이유가 풀려야 재개되므로 탭 전환이 수동 일시정지를 풀지 않습니다.

## 화면 크기와 전체화면

- 이 프로젝트는 고정 논리 해상도(720×1280) + `FIT`입니다. 좌표는 `this.scale.width/height`를 기준으로 계산하면 해상도를 바꿔도 따라옵니다.
- 화면 구성을 변경할 때 `width`/`height`를 바꾸고 `orientation: 'portrait'`로 둡니다. HTML 영역의 비율은 Shell이 config에서 읽습니다.
- 전체화면 버튼은 지원 브라우저에서만 보입니다(iPhone Safari는 미지원). 전체화면에서 권장 방향이 아니면 회전 안내가 뜹니다.

## 디버그와 오류

- 개발 서버 주소에 `?debug`를 붙이면 Arcade 물리 충돌 영역이 보입니다. 배포 빌드에서는 무시됩니다.
- `?round=5`처럼 붙이면 예제 한 판을 5초로 줄입니다(E2E에서 사용). 실제 게임의 조정값이 보상·랭킹에 영향을 준다면 `import.meta.env.DEV`일 때만 읽도록 합니다.
- 처리되지 않은 오류와 Promise 거부는 게임 화면 위에 안내와 새로고침 버튼으로 표시됩니다. 콘솔 출력은 그대로 남습니다.

## 검증

| 명령                             | 내용                                                      |
| -------------------------------- | --------------------------------------------------------- |
| `npm run check`                  | 린트, 포맷, 단위 검사, 타입 검사, 배포 빌드               |
| `npm run test:e2e`               | 개발 서버에서 Chromium desktop / Pixel 7 크기로 실제 조작 |
| `E2E_PREVIEW=1 npm run test:e2e` | 이미 빌드한 `dist/`를 검사. `npm run build` 후 실행       |

검사 서버는 4173 포트를 씁니다. CI는 두 E2E 모드를 모두 실행하고 실패 시 trace/screenshot을 보관합니다.
Safari/Firefox/실기기는 따로 확인해야 합니다. 모바일 에뮬레이션은 실기기 검증이 아닙니다.

## 정적 배포

```bash
npm ci
npm run check   # 배포 빌드까지 생성
npm run preview # 올리기 전에 dist 확인
```

- `dist/` 내용 전체(음원 포함)를 정적 서버에 올립니다. `base: './'`이므로 `/my-game/` 같은 하위 경로, itch.io(zip 업로드)도 됩니다.
- 라우터가 없어 SPA rewrite 설정은 필요 없습니다. `index.html`을 파일로 직접 열지 말고 HTTP 서버로 엽니다.
- 해시가 붙은 JS/CSS는 장기 캐시해도 됩니다. `index.html`과 고정 이름 음원은 업데이트 때 캐시를 갱신합니다.
- 환경 변수는 `.env.example`을 참고합니다. `VITE_*` 값은 번들에 공개되므로 비밀키를 넣지 않습니다.

## 문제 해결

| 증상                           | 확인                                                                      |
| ------------------------------ | ------------------------------------------------------------------------- |
| 빈 화면/로딩 실패              | 개발자 도구 Network에서 asset 404, JS 오류 확인. HTTP 서버로 실행         |
| 소리 없음                      | 플레이 버튼을 눌렀는지, 브라우저/OS 음소거, 게임 볼륨 확인                |
| "저장 보호 모드" 표시          | 손상·미래 버전 데이터. 필요하면 개발자 도구에서 백업한 뒤 설정에서 초기화 |
| 폰에서 접속 불가               | 같은 Wi-Fi인지, PC 방화벽, Network 주소 확인                              |
| 방향키로 이동 안 됨            | 게임 화면을 눌러 포커스. 설정 창/일시정지 상태 확인                       |
| 게임패드 인식 안 됨            | 연결 후 버튼을 한 번 눌러야 브라우저가 패드를 알려 줍니다                 |
| 배포에서 광고/결제 unavailable | 정상. 실제 Adapter를 연결하기 전의 기본 동작                              |
