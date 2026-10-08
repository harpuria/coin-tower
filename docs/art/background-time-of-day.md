# 시간대 배경 제작 기록

- 제작일: 2026-10-09.
- 요청: 현재 배경을 보존하면서 높은 적층에 사용할 점심·저녁 등 시간대 배경 제작.
- 참조: `public/assets/coin-tower/sky_ruins.png`, 941×1672 RGB PNG, SHA-256 `7939e2a463b49bb89820ac8dac8c6c3286d938e37fb0bb95d2bd233d1cd18987`.
- 도구: OpenAI 내장 `image_gen.imagegen`, 참조 이미지 편집, `transparent_background: false`. 모델 상세 버전·seed는 도구에서 제공하지 않는다.
- 범위: 시간대 변형 자산 세 장 제작 완료. 이후 [시간대 배경](../design/backgrounds.md) 기준 런타임 연결을 적용했다. 원본 파일은 그대로 보존했다.
- 후처리: 없음. 생성 결과 PNG를 byte 변경 없이 복사했다. 리사이즈·색 보정·알파 수정은 하지 않았다.
- 이용 조건과 참조 권리 기록: [자산 출처](../ASSET_SOURCES.md).

## 산출물

아래 경로는 `public/assets/coin-tower/backgrounds/` 기준이다. 모두 불투명 RGB PNG다.

| 시간대       | 파일                    | 크기     | 파일 bytes | SHA-256                                                            |
| ------------ | ----------------------- | -------- | ---------- | ------------------------------------------------------------------ |
| 점심         | `sky_ruins_noon.png`    | 941×1672 | 1,846,078  | `c66ea479a436fcada4059bf02e8c935eeb8e14e01907744282666895673a7117` |
| 노을 진 저녁 | `sky_ruins_evening.png` | 941×1671 | 1,839,113  | `d732c7cd201fd4ef2d0ade72f6bd749f152194ce5757add1c747e5c2d9a61623` |
| 밤           | `sky_ruins_night.png`   | 941×1672 | 1,764,608  | `b5030e4997fa5892c53d0831fdeda0f51934e3cda8d49e9eddc8d8a70ffec7ad` |

- 새 파일 합계: 5,449,799 bytes, 약 5.45 MB. 세 장의 RGBA 픽셀 환산 합계는 약 18.0 MiB이며 엔진·브라우저 캐시 비용은 별도다.
- 저녁 출력은 원본보다 세로 1px 작다. 실제 런타임에 연결하기 전에 같은 표시 크기에서 경계 정렬과 전환을 관찰해야 한다.
- 현재 asset manifest·scene에 연결했고 새 파일 세 장을 미리 로드한다. `public/`의 파일이 배포 빌드에도 포함되므로 패키지 용량이 늘어난다.

## 확인 결과와 한계

- 원본과 생성 결과를 직접 보고 비교했다. 유적·배너·섬·폭포의 큰 배치와 중앙의 빈 하늘은 유지됐다.
- 점심: 따뜻한 아침색을 줄이고 깨끗한 푸른 하늘·중성 흰 구름·밝은 청록 물을 사용한다.
- 저녁: 살구·주황 하늘, 라벤더 윗하늘과 그림자, 따뜻한 돌과 수면 반사로 시간을 구분한다.
- 밤: 남색·보랏빛 하늘과 차가운 유적·폭포로 표현하되 건물의 형태가 보이도록 중간 밝기를 남긴다. 달·별·새 광원은 추가하지 않았다.
- 참조 편집으로 일부 질감과 세부 윤곽이 다시 그려졌다. 픽셀 단위로 동일한 구도나 완벽한 크로스페이드 정렬을 보장하지 않는다.
- PNG 메타데이터·파일 해시를 확인했고 복사 전후 원본 해시가 일치한다. 실제 게임에서 동전·Perfect·HUD 가독성, 모바일 첫 로딩·메모리·시간대 전환은 확인하지 않았다.
- 생성 단계에서는 게임 테스트·브라우저 검사·배포 빌드를 실행하지 않았다. 이후 런타임 연결 작업의 정적 검사·빌드 결과와 아직 확인하지 못한 동작은 [검증 기록](../VALIDATION.md)을 따른다.

## 입력 프롬프트

### noon

```text
Edit the supplied Coin Tower portrait background as a tightly registered time-of-day lighting variant for the SAME game scene. The reference image is 941 by 1672 pixels, portrait. Preserve its exact composition, camera, framing, aspect ratio, all architectural silhouettes, columns, arches, blue crown banners, floating islands, mountains, waterfalls, foliage, cloud outlines/positions and the large clear center/upper sky used for coin gameplay. DO NOT repaint/reinvent/rearrange the scene, add buildings, move clouds, zoom, crop or change landscape details. Change only sky colors, environmental light/color temperature, illumination and shadows as appropriate to the requested time. Match the original soft polished stylized casual-game painting and existing gently blurred background rendering. Opaque full-bleed background, no transparency, no text, UI, coins, frame or borders. Deliver one single full portrait image, not a collage. Retain the reference's 941x1672 size if supported, otherwise the closest portrait aspect ratio with the entire original scene visible. NOON / midday: clear bright azure-cyan sky, crisp neutral white sunlit clouds, brighter ivory sandstone, lush natural greens and luminous turquoise water. Compared with the original warm morning, use a clean overhead daylight feel, neutral-cool whites and slightly clearer deeper blue sky, with reduced warm yellow sunlight. No visible new sun disk or rays; retain comfortable background contrast and original atmosphere. Make this recognizably noon while changing lighting only.
```

### evening

```text
Edit the supplied Coin Tower portrait background as a tightly registered time-of-day lighting variant for the SAME game scene. The reference image is 941 by 1672 pixels, portrait. Preserve its exact composition, camera, framing, aspect ratio, all architectural silhouettes, columns, arches, blue crown banners, floating islands, mountains, waterfalls, foliage, cloud outlines/positions and the large clear center/upper sky used for coin gameplay. DO NOT repaint/reinvent/rearrange the scene, add buildings, move clouds, zoom, crop or change landscape details. Change only sky colors, environmental light/color temperature, illumination and shadows as appropriate to the requested time. Match the original soft polished stylized casual-game painting and existing gently blurred background rendering. Opaque full-bleed background, no transparency, no text, UI, coins, frame or borders. Deliver one single full portrait image, not a collage. Retain the reference's 941x1672 size if supported, otherwise the closest portrait aspect ratio with the entire original scene visible. EVENING / sunset: luminous peach and warm apricot low sky blending smoothly into muted rose and lavender higher sky, warm coral edges on the existing cloud shapes, honey/copper sunset light on the existing sandstone, cooler lavender shadows, peach-violet reflections on the same water and waterfalls. The composition and every landscape element must remain registered to the reference. Clearly different time from the original morning, but still bright enough behind gold coins. No visible new sun disk, dramatic flare, extra clouds or objects.
```

### night

```text
Edit the supplied Coin Tower portrait background as a tightly registered time-of-day lighting variant for the SAME game scene. The reference image is 941 by 1672 pixels, portrait. Preserve its exact composition, camera, framing, aspect ratio, all architectural silhouettes, columns, arches, blue crown banners, floating islands, mountains, waterfalls, foliage, cloud outlines/positions and the large clear center/upper sky used for coin gameplay. DO NOT repaint/reinvent/rearrange the scene, add buildings, move clouds, zoom, crop or change landscape details. Change only sky colors, environmental light/color temperature, illumination and shadows as appropriate to the requested time. Match the original soft polished stylized casual-game painting and existing gently blurred background rendering. Opaque full-bleed background, no transparency, no text, UI, coins, frame or borders. Deliver one single full portrait image, not a collage. Retain the reference's 941x1672 size if supported, otherwise the closest portrait aspect ratio with the entire original scene visible. NIGHT / early blue hour after sunset: deep but readable indigo/royal-blue upper sky with a soft muted violet-blue low horizon, softly moonlit blue-white existing clouds and waterfalls, cool blue-lavender sandstone with restrained residual warm highlights, subdued teal foliage and water. Keep sufficient midtone detail in architecture, no black silhouettes. Do NOT add a moon, stars, new lights, buildings or other objects; express time only through existing scene lighting and color. Preserve original cloud positions and all landscape edges.
```
