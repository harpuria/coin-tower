# SHOP·소리·전체화면 아이콘 제작·적용 기록

## 범위와 방향

- 날짜: 2026-10-13. 사용자가 상점 아이콘 방향을 채택하고 SHOP, SOUND ON/OFF, FULLSCREEN 버튼 제작을 요청했다.
- SHOP은 파란 차양·금색 테두리의 상점이다. 메뉴에 작은 SHOP 글자를 별도로 유지하고 기존 스킨 목록을 연다. 목록 제목 COIN SKINS와 구매 규칙은 바꾸지 않는다.
- 소리는 파란 스피커와 금색 음파 / 붉은 사선이 있는 스피커로 구분한다. 전체화면은 바깥 방향 / 안쪽 방향 화살표로 구분한다.
- 기존 `hud_panel.png`의 파란 광택과 `icons/best-coins.png`의 금색 베벨·외곽선을 기준으로 삼았다. 버튼 판 없이 아트 자체를 표시하며 글자는 PNG에 넣지 않았다.

## 생성·출처

- 도구: OpenAI 내장 `image_gen.imagegen`. 상세 모델 버전·seed는 제공되지 않았다.
- 총 5회: SHOP을 두 기존 이미지에서 생성하고, SOUND ON과 전체화면 진입은 SHOP을 참조했다. SOUND OFF는 SOUND ON, 전체화면 해제는 진입 이미지를 참조해 편집했다.
- 모든 호출은 `transparent_background: true`였다. 지시 크기는 512×512였으나 실제 결과는 모두 1254×1254 RGBA PNG다. 생성 원본을 그대로 복사했고 자르기·축소·재도색·알파 보정은 하지 않았다.
- 개별 원본 경로·bytes·SHA-256·알파 >8 경계는 [메타데이터](utility-icons-metadata.json)에 기록했다. 원본은 생성 폴더에 보존했다.
- 5장 합계 5,123,233 bytes(약 4.89MiB), 원시 RGBA 합계 31,450,320 bytes(약 30MiB)다. Phaser texture와 HTML 이미지·브라우저 캐시 비용은 별도이며 최저 사양 기기의 로딩·메모리 성능은 미확인이다.

## 전달 파일

경로는 `public/assets/coin-tower/icons/`다.

| 파일                   | 표현                             | 참조                        |
| ---------------------- | -------------------------------- | --------------------------- |
| `shop.png`             | 파란 차양·금색 외곽선의 상점     | 기존 hud_panel / best-coins |
| `sound-on.png`         | 스피커와 음파 두 개              | SHOP                        |
| `sound-off.png`        | 스피커와 붉은 음소거 사선        | SOUND ON                    |
| `fullscreen-enter.png` | 네 모서리 바깥으로 향하는 화살표 | SHOP                        |
| `fullscreen-exit.png`  | 중앙 안쪽으로 향하는 화살표      | FULLSCREEN 진입             |

## 런타임 적용과 표시

- `src/game/assets.ts`에서 필수 자산으로 미리 읽고 `src/ui/Shell.ts`에서 실제 네이티브 버튼 안에 표시한다. 누락 자산은 기존 로딩 오류 정책을 따른다.
- `#skins-menu`는 표시 이름 SHOP으로 바꿨으며 기존 controller·저장·스킨 화면을 재사용한다. 내부 ID는 기존 연결을 유지한다.
- `#mute`는 사용자 설정과 플랫폼 음소거를 함께 읽어 ON/OFF 이미지를 선택한다. 플랫폼이 소리를 끄면 OFF·비활성화·접근성 설명을 표시하고 사용자 저장 설정은 보존한다.
- `#fullscreen`은 실제 Phaser fullscreen 상태로 진입/해제 이미지를 선택한다. 미지원 브라우저와 CrazyGames 빌드에서 숨기는 기존 정책을 유지한다.
- `src/style.css`의 `.utility-button`·`.utility-caption`에서 조정한다. 아트는 `clamp(32px, 10cqw, 72px)`, 클릭 영역은 가로·세로 최소 44px, SHOP 글자는 `clamp(10px, 2.5cqw, 18px)`다. 투명 여백은 원본 그대로 유지한다.
- 판·테두리 없이 짧은 그림자를 사용하고 마우스 호버 밝기·눌림 축소를 준다. 동작 줄이기에서는 눌림 축소를 적용하지 않는다. title 설명·aria-label·소리 aria-pressed·키보드 포커스를 유지한다.
- 게임 시작/낙하 입력과 분리하며 SHOP에서는 기존 대화상자 입력·포커스 정책을 따른다. 메뉴의 저장 오류 문구는 SHOP과 우측 조작 사이의 하단 중앙에 배치해 시작 글자와 겹치지 않게 했다.

## 비교·관측과 한계

- 파일의 크기·RGBA·알파 0~255·해시를 확인했다. Pillow는 메타데이터 읽기에만 사용했다.
- 원본 이미지의 파란 광택·금색 베벨·짙은 외곽선을 이어간다. 상점의 차양·문·창, 스피커의 음파/사선, 화살표 방향이 서로 다른 기능을 표현한다.
- 생성 편집은 스피커 몸체의 픽셀 위치까지 동일하지 않으며 ON/OFF의 광학적 폭이 다르다. 공통 캔버스·고정 표시 영역으로 버튼 위치가 움직이지 않게 했다.
- Chromium PC·Pixel 7 터치 에뮬레이션에서 실제 메뉴·SHOP·플레이·일시정지, 소리 전환과 재접속, 실제 전체화면 진입·해제, 360×640·821×462 배치를 관측했다. 관측과 production/실제 포털의 경계는 [검증 기록](../VALIDATION.md)을 따른다.
- 사용자 선호·처음 보는 사람의 기능 인식 속도·실기기·Safari/Firefox 성능은 미확인이다. 산출물은 `test-results/utility-icons/`에 있다.

## 프롬프트

### SHOP

```text
Create ONE isolated transparent PNG SHOP utility icon for Coin Tower. Reinterpret the supplied UI panel's saturated royal-blue/cyan gloss and supplied gold coin icon's warm gold beveled edges as a small friendly storefront. Compact frontal view of a tiny shop: a bold striped royal-blue and light-cyan scalloped awning, chunky warm-gold trim, simple cream-gold facade with one dark blue doorway and one small display window, a very simple blue sloped roof. Clear symmetrical near-square silhouette recognizable at 40–56 pixels. Polished cartoon 2.5D casual mobile game style, rounded substantial forms, top-left creamy highlights, dark navy outline, few large shapes. This is the storefront itself, not an icon sitting on a plate or badge. Complete artwork centered on a square 512x512 transparent canvas, roughly 8% breathing room, fills 80–84% width/height. No wording, no SHOP text, no letters, no coins, no star shards, no crowns, no floating particles, no decorative sign, no scenery, no ground, no cast shadow outside the silhouette, no circular or rectangular button plate, no checkerboard. True alpha transparent background. Deliver a single asset, not a sheet. Intended filename shop.png.
```

### SOUND ON

```text
Match the provided storefront reference's glossy royal-blue faces, warm gold bevels, creamy top-left highlights, dark navy outline and rounded chunky 2.5D casual-game finish. Produce ONE isolated utility icon on a square 512x512 true alpha-transparent canvas, centered and complete with about 8–10% transparent margin. Very simple bold geometry legible at 40–56 pixels. No letters, no text, no scenery, no sparkle particles, no badge, no circular or rectangular button plate, no drawn checkerboard, no external ground shadow. The icon itself is the button artwork. Subject SOUND ON: a conventional loudspeaker pictogram, rectangular driver at left merging into a wide right-facing flared cone, glossy blue face and gold bevel, with EXACTLY TWO thick separated curved sound-wave arcs to its right in warm gold. Flat frontal symbolic view with shallow sculpted depth, no realistic device controls, no stand, no extra components. The cone and arcs form one near-square compact centered group. Intended filename sound-on.png.
```

### SOUND OFF

```text
Edit the supplied SOUND ON icon into its matching SOUND OFF state. Preserve the exact speaker body design, placement, size, royal-blue faces, gold bevel, highlight style, dark navy edges and transparent square canvas. REMOVE both sound-wave arcs at the right. Add ONE clear bold diagonal mute slash running from upper-left to lower-right across the speaker and the area formerly occupied by the arcs. The slash has a saturated red/coral face, warm gold bevel and dark navy outer edge, shallow glossy 2.5D depth matching the speaker. Keep the body silhouette/scale and approximately the same overall group bounds; the slash must be unmistakable at 40–56px. No words, no letters, no additional X, no badge or panel, no external shadow, no checkerboard. True alpha-transparent PNG; single icon only. Intended filename sound-off.png.
```

### FULLSCREEN 진입

```text
Match the provided storefront reference's glossy royal-blue faces, warm gold bevels, creamy top-left highlights, dark navy outline and rounded chunky 2.5D casual-game finish. Produce ONE isolated utility icon on a square 512x512 true alpha-transparent canvas, centered and complete with about 8–10% transparent margin. Very simple bold geometry legible at 40–56 pixels. No letters, no text, no scenery, no sparkle particles, no badge, no circular or rectangular button plate, no drawn checkerboard, no external ground shadow. The icon itself is the button artwork. Subject ENTER FULLSCREEN: exactly FOUR bold diagonal arrows arranged symmetrically around a generous transparent central void, one arrow pointing OUTWARD toward each corner. Each arrow is one short diagonal shaft with a large simple arrowhead. Royal-blue glossy faces, substantial warm gold bevels and navy outside edges. Clean flat frontal view, no perspective skew, equally sized arrows, square composition. The central gap MUST remain empty transparent. No enclosing frame, no box, no center object, no added symbols. Intended filename fullscreen-enter.png.
```

### FULLSCREEN 해제

```text
Edit the supplied ENTER FULLSCREEN four-arrow utility icon into its matching EXIT FULLSCREEN state. Preserve the exact square transparent canvas, glossy royal-blue faces, thick warm-gold bevels, dark navy outer edges, shallow depth and creamy top-left highlights. Reverse the direction of ALL FOUR arrows so they point INWARD diagonally toward the center: upper-left arrow points down-right, upper-right points down-left, lower-left points up-right, lower-right points up-left. Four separate equal arrows arranged symmetrically, leave a clear transparent central gap so arrow tips never touch. Short shafts extend toward the outer corners, arrowheads toward the center. Preserve the approximate overall group bounds and weight of the original. Bold simple shape readable at 40–56px, no enclosing frame, no box, no central object, no badge, no text, no extra symbols, no external shadows. True alpha-transparent PNG, single cohesive icon only. Intended filename fullscreen-exit.png.
```

## 이용 조건

확인일 2026-10-13. [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/)의 Content 절에 따라 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속하며 독점성은 보장되지 않는다. 입력 참조 권리와 서비스 이용 조건은 계속 적용된다. 실제 계정에 적용되는 계약 종류는 확인하지 않았다. 별도 제삼자 이미지·폰트는 추가하지 않았다. 플랫폼 제출 시 AI 생성물 공개 여부는 사용자가 결정한다.
