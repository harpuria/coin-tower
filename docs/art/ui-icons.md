# 기록·별조각 아이콘 제작 기록

## 생성과 범위

- 날짜: 2026-10-12.
- 사용자 요청: BEST COIN, BEST COMBO, STAR SHARDS 아이콘 이미지를 먼저 생성한다. 초기 요청은 이미지 제작이며, 후속 요청으로 메뉴·결과·인게임 적용을 진행했다.
- 도구: OpenAI 내장 `image_gen.imagegen`. 모델 상세 버전·seed는 제공되지 않았다.
- 공통 참조: `public/assets/coin-tower/coin.png`, `perfect.png`. 금화의 재질·광원과 Perfect의 둥근 베벨·외곽선을 기준으로 삼았다.
- 공통 옵션: `transparent_background: true`. 한 아이콘당 한 번 생성, 총 세 번. BEST COINS를 먼저 생성하고 나머지 두 이미지는 같은 기존 참조로 각각 생성했다.
- 지시 크기는 1024×1024였으나 실제 출력은 모두 1254×1254 RGBA다. 원본 PNG를 그대로 복사했으며 자르기·축소·재도색·알파 보정은 하지 않았다.

## 전달 파일

| 파일 (`public/assets/coin-tower/icons/`) | 표현                                       | 크기      |   bytes | SHA-256                                                            |
| ---------------------------------------- | ------------------------------------------ | --------- | ------: | ------------------------------------------------------------------ |
| `best-coins.png`                         | 왕관과 금화 4개 탑                         | 1254×1254 | 1058785 | `ee458402fc4f1ba2db065345bda506035b1788cf14ac3e487e2fc9df7d7a6f25` |
| `best-combo.png`                         | 작은 것부터 이어지는 금빛 네 갈래 섬광 3개 | 1254×1254 |  567199 | `eb34d061aaa5440a3bb201f4720de557d246dc56eaabaa2edf17a748b622211c` |
| `star-shards.png`                        | 청록색 다섯 갈래 별 결정과 조각            | 1254×1254 |  825631 | `33fed458627a77c4693e2c50e640da61b211a26419a4cd42ae846cbc1c744f4a` |

파일 합계 약 2.34MiB이며 세 장을 원본 해상도로 디코드한 RGBA 합계는 약 18MiB다. GPU·브라우저 캐시 비용은 별도다. 현재 필수 자산 manifest에 등록했고 Shell의 HTML 이미지로 표시한다. CSS로 투명 여백과 표시 크기를 조정하며 원본 해상도는 유지한다. 실제 최저 사양 기기의 디코딩·메모리 비용은 측정하지 않았다.

## 생성 원본 보존

기본 폴더: `/Users/yhh/.codex/generated_images/01a1163e-8f6f-7ca1-80b8-45c2a26f62e3/`.

- BEST COINS: `exec-12428169-c9d0-4b70-90ef-8f2cb3f28404.png`.
- BEST COMBO: `exec-57a66e2c-81d6-47d7-af8f-59e007477ed5.png`.
- STAR SHARDS: `exec-7328a7cd-cf01-4f78-b21d-cbe5500a6328.png`.

프로젝트 파일과 원본은 같은 바이트다. 원본은 삭제하지 않았다.

## 프롬프트

### BEST COINS

```text
Create a single production-ready game UI icon on a true transparent background for the existing Coin Tower casual web game. Use the provided reference gold coin as the material/style baseline and the PERFECT art as the bevel/highlight/outline baseline. Subject: BEST COINS / highest stacked coin record, expressed ONLY pictorially with a compact upright tower of exactly four thick gold coins, slightly staggered but stable, with a small distinctive three-point gold crown sitting on the uppermost coin. The gold coins have the same round rim, orange-gold ribbed sides, warm yellow face and subtle embossed crown motif as the reference. Make a compact near-square silhouette with a clear tall stacking direction. Polished cartoon 2.5D mobile casual game art, chunky friendly shapes, bright creamy top-left highlights, saturated lemon/gold faces, amber lower-right bevels, a clean dark amber/brown outer rim, crisp silhouette legible at 48 px. Center the complete icon inside a square 1024x1024 canvas with roughly 10 percent transparent breathing room on all sides. No text, no letters, no numbers, no words, no trophy cup, no panel, no circular badge, no rectangular background, no scenery, no checkerboard drawn into the art, no ground plane or cast shadow outside the object, no particles or scattered confetti. This is ONE isolated icon, not an atlas. Keep actual alpha transparency. Save the generated image file if supported; it will be used as best-coins.png.
```

### BEST COMBO

```text
Create ONE isolated production-ready transparent PNG icon for BEST COMBO, the highest consecutive Perfect landing streak in Coin Tower, a glossy casual web game. References establish the style: the PERFECT graphic has four-point yellow/white sparkle stars, thick warm amber contours and orange 3D bevels; the coin shows rich glossy gold material. Depict a compact diagonal ascending chain of EXACTLY THREE chunky FOUR-POINT sparkle stars, small at lower left, medium in the middle, and large at upper right. Connect their bases with one short smooth orange-gold swoosh that makes one cohesive near-square emblem communicating consecutive successful hits. The dominant large sparkle has a pale creamy white center, lemon-yellow face, warm gold beveled edge and dark amber outline, matching the reference sparkle shapes. Stars must NOT be five-point trophy stars and must NOT be crystals or coins. Clean friendly mobile-casual 2.5D render, strong simplified silhouette, broad top-left specular highlights, restrained warm glow only within the icon silhouette, crisp readable at 48 px. Center the complete icon inside a square 1024x1024 canvas with about 10 percent fully transparent breathing room. Actual alpha transparency, no backdrop, no drawn checkerboard, no text, no letters, no X, no multiplier, no numbers, no ribbon, no badge, no circle, no frame, no scenery, no ground shadow, no extra tiny particles. Only this single cohesive triple-sparkle combo icon. Intended filename best-combo.png.
```

### STAR SHARDS

```text
Create ONE isolated production-ready transparent PNG currency icon for STAR SHARDS in Coin Tower, matching the polished cartoon 2.5D casual game art in the references. The gold coin reference establishes chunky bevels, rich specular top-left light, warm-dark clear outlines and rounded friendly proportions; PERFECT establishes bright creamy highlights. The subject is a single large chunky FIVE-POINT STAR-SHAPED CRYSTAL, with two small broken crystal chips at lower right, forming one compact near-square cluster. The central crystal is bright turquoise/cyan, with a luminous icy-white top-left facet, saturated teal inner facets, medium blue lower-right bevels and a clearly defined dark teal/blue outer edge. Keep the star points substantial and softly rounded, with just a few large clean geometric facets, legible at 48 px. One smaller irregular cyan crystal chip and one tiny triangular chip reinforce the idea of collectible shards. This is a blue crystal currency, visually distinct from both gold coins and gold four-point Perfect sparkles. Use the same gloss intensity and simplified rich 3D cartoon shading as the references. Center the full cluster inside a square 1024x1024 canvas with roughly 10 percent transparent breathing room on all sides. True alpha transparency. No text, no letters, no numbers, no coins, no crown, no container, no money bag, no panel, no badge, no circular frame, no scenery, no drawn checkerboard, no ground plane, no external shadow or wide glow cloud. ONLY ONE compact star crystal and its two chips. Intended filename star-shards.png.
```

## 투명도와 축소 관찰

- Pillow로 파일을 읽어 크기·RGBA·알파 범위 0~255·해시를 확인했다. 이미지 픽셀 편집에는 사용하지 않았다. 내부 대부분의 알파는 253이며 가장자리와 배경에 0·부분 알파가 있다. 이는 생성된 원본 그대로다.
- Chromium에서 [자산 미리보기](ui-icons-preview.html)를 열고 실제 기존 파란 패널과 별조각 청록색 패널에 48·64·96px로 표시했다. 체크무늬 위 160px도 비교해 배경이 이미지에 구워져 있지 않음을 확인했다.
- 금화의 왕관·층, 콤보의 연결된 금빛 섬광, 별조각의 청록색 결정은 축소 화면에서 구분된다. 금화 재질과 Perfect 베벨은 기존 이미지와 가깝다. 48px에서 작은 결정 조각·작은 섬광 세부는 줄어들며, 실제 UI에서는 숫자와 아이콘의 크기 관계를 다시 관찰해야 한다.
- 정사각 캔버스 내 실루엣 비율이 다르므로 같은 CSS 크기에서도 광학적 크기가 완전히 같지는 않다. 생성 이미지 간 형태를 같게 변형하지 않았다.
- 산출물: `test-results/ui-icons/preview.png`, `metadata.json`. 미리보기는 게임 장면이나 실제 사용자 가독성 검증이 아니다. 이번 작업에서는 게임 코드·기존 이미지·배포 빌드를 변경하지 않았으며 테스트 스위트를 실행하지 않았다.

## 런타임 적용 — 2026-10-12

- `src/game/assets.ts`의 필수 이미지 로더와 `src/ui/Shell.ts`에 연결했다. 메뉴의 두 개인 최고, 결과의 두 행과 별조각 보상, 인게임의 두 개인 최고·별조각 잔액에 사용한다. 현재 점수는 COINS, 결과의 비교 열은 THIS RUN/BEST, 재화는 EARNED/TOTAL을 유지한다.
- `src/style.css`의 `.stat-icon`이 표시만 조정한다. 알파 >8 영역의 경계(금화 238,50–1037,1200 / 콤보 169,160–1182,1048 / 별조각 160,162–1129,1137)를 참고해 원본을 비례 확대·이동하고 정사각 표시 영역으로 투명 여백을 제외했다. 원본 PNG나 해시는 바뀌지 않았다.
- 표시 영역은 메뉴 기록 10cqw, 메뉴·결과 별조각 7cqw, 결과 기록 8cqw, 인게임 5.5cqw다. 메뉴 숫자 간격 2cqw, HUD 1cqw이며 실루엣 비율은 보존한다. 수정 위치는 위 CSS 선택자다.
- HUD는 오른쪽 53% 영역의 두 줄이다. 왼쪽은 BEST 동전/콤보, 오른쪽은 COINS/보유 별조각이다. 첫 배치에서 가려졌던 좌측 로고를 보존하도록 수정했다. 별조각은 진행 중 예상 지급량이 아닌 이미 정산된 잔액이다.
- 이미지에는 빈 alt와 aria-hidden을 적용하고 실제 항목명은 숨긴 텍스트로 유지한다. 결과 표의 행·열 의미, 항목별 NEW BEST, 실제 버튼 입력은 유지한다.
- 개발·배포 Chromium의 실제 입력과 화면 관측은 [검증 기록](../VALIDATION.md), 산출물은 `test-results/icon-integration/`에 있다. 실제 기기와 사람의 항목 인식 속도는 미확인이다.

## 이용 조건

확인일 2026-10-12. [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/)의 Content 절에 따라 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속한다. 입력을 사용할 권리와 서비스 이용 조건은 계속 적용되며 결과의 독점성은 보장되지 않는다. 별도 제삼자 폰트·이미지는 추가하지 않았다. 실제 계정에 적용되는 계약 종류는 확인하지 않았다. 플랫폼 제출 시 AI 생성물 공개 여부는 사용자가 결정한다.
