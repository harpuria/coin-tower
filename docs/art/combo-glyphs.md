# Perfect 콤보 글자 제작 기록

## 생성

- 날짜: 2026-10-08.
- 도구: OpenAI 내장 `image_gen.imagegen`. 정확한 모델 버전·seed는 도구가 공개하지 않았다.
- 참조: `public/assets/coin-tower/perfect.png` 원본 한 장. 원본은 수정하지 않았다.
- 옵션: `transparent_background: true`.
- 결과: 1448×1086 RGBA 스프라이트 시트, 4열·3행. `X012 / 3456 / 789[빈 칸]` 순서.
- 생성 원본은 `/Users/yhh/.codex/generated_images/01a1163e-8f6f-7ca1-80b8-45c2a26f62e3/exec-74618772-3d08-4de9-9403-b97153ae647f.png`에 보존했다. 원본 SHA-256: `be9c46995822d129c237ed738f521f979f8f48a31a2307465c7870f216f252df`.

### 프롬프트

```text
Create one production-ready transparent PNG sprite atlas for a casual mobile/web game's Perfect combo numerals. Use the reference image's exact visual language: chunky rounded bold letters, bright lemon-yellow/gold faces with creamy white top-left specular highlights, orange beveled 3D lower-right extrusion, thick dark red-brown outer outline. Keep glyphs front facing, upright, unrotated, and extremely legible at small game UI size. The ONLY content is eleven isolated glyphs: capital X and digits 0 through 9. NO words, NO PERFECT text, NO sparkles, NO stars, NO glow clouds, NO decorative particles, NO background, NO captions, NO grid lines. Arrange a strict regular atlas of FOUR equal-width columns and THREE equal-height rows, entire canvas landscape aspect 4:3. Cell order: row1 = X,0,1,2; row2 = 3,4,5,6; row3 = 7,8,9,[empty transparent cell]. Exactly one centered glyph in each occupied cell. All glyphs share the same visual cap height and common baseline within each cell. Each glyph including full extrusion/outline fits inside the central 65 percent of its cell, leaving generous fully transparent cell gutters on all sides for lossless slicing. Digits must be correctly drawn, unmistakable, and stylistically consistent; 1 has a top flag and small base, 0 has one open counter, 8 has two open counters. Match the reference's rich gold cartoon material and outline, but omit its tilted word arrangement and surrounding sparkles. Deliver actual alpha transparency.
```

## 분리·출력

Chromium Canvas로 셀별 알파 경계를 측정해 개별 PNG로 내보냈다. 생성 결과의 글자가 균등 행 경계를 조금 넘으므로 실제 투명 간격인 y=390·715를 행 경계로 사용했다. 열은 362px 단위다. 알파 > 8인 외곽을 찾고 3px의 원본 여백을 포함해 미세한 테두리를 보존했다. 알파 1 수준의 빈 공간 잡점은 글자 경계를 결정하는 데 사용하지 않았다.

각 글자를 비례 축소해 높이 188px로 맞추고 사방 최소 2px 투명 여백을 추가했다. 최종 높이는 192px다. 색·형태·테두리의 수작업 재도색은 없다.

| 파일    | 원본 영역 x/y/w/h | 출력 w/h | 용량 bytes |
| ------- | ----------------- | -------- | ---------- |
| `x.png` | 57/84/271/287     | 182/192  | 55405      |
| `0.png` | 424/76/258/299    | 167/192  | 47998      |
| `1.png` | 800/76/222/297    | 145/192  | 38194      |
| `2.png` | 1140/70/257/297   | 167/192  | 51566      |
| `3.png` | 64/405/263/299    | 170/192  | 52803      |
| `4.png` | 416/405/276/295   | 180/192  | 46088      |
| `5.png` | 785/404/253/300   | 163/192  | 51034      |
| `6.png` | 1140/405/258/299  | 167/192  | 48037      |
| `7.png` | 63/726/264/295    | 173/192  | 46018      |
| `8.png` | 415/722/269/304   | 171/192  | 51754      |
| `9.png` | 774/723/273/302   | 174/192  | 50905      |

최대 텍스처 크기는 182×192px다. 11장의 RGBA 픽셀 합계는 약 1.4MiB이며 브라우저·Phaser 내부의 캐시 복사와 관리 비용은 별도다. 기존 Perfect 원본은 유지한다.
