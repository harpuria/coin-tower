# TAP TO PLAY 제작·적용 기록

## 생성

- 날짜: 2026-10-12. 사용자 요청으로 메인 화면 PLAY 버튼 판과 하단 조작 설명을 없애고 이미지 문구를 적용한다.
- 파일: `public/assets/coin-tower/tap_to_play.png`.
- 도구: OpenAI 내장 `image_gen.imagegen`(기본 도구 방식), 한 번 생성. 상세 모델 버전·seed는 제공되지 않았다.
- 참조: `public/assets/coin-tower/logo.png`의 흰 TOWER 글자·파란 베벨과 `perfect.png`의 광택 품질. 기존 파일은 수정하지 않았다.
- 옵션: `transparent_background: true`. 지시 크기 약 1536×512, 실제 출력 2172×724 RGBA·812,872 bytes다. RGBA 원시 픽셀 약 6.0MiB이며 캐시·GPU 비용은 별도다.
- 알파: 0~255. 알파 >8의 글자 영역은 (32,188)–(2146,554)이며 글자 사이·구멍에 실제 투명도가 있다. 낮은 알파의 가장자리 흔적은 더 넓게 분포한다.
- SHA-256: `442e8b152612dcc7e176fefa2f7bc04a30e527f9247c28e9527c23803b75240d`.
- 생성 원본: `/Users/yhh/.codex/generated_images/01a1163e-8f6f-7ca1-80b8-45c2a26f62e3/exec-5366d794-214b-471b-925d-ce4267d33317.png`. 그대로 복사했으며 픽셀 후처리 없음. 크기·알파·해시는 읽기만 했다.

## 프롬프트

```text
Use case: stylized-concept. Create ONE production game UI lettering asset for Coin Tower, on a genuinely transparent background. The attached local logo.png is STYLE REFERENCE ONLY: use the white "TOWER" letters' chunky rounded uppercase forms, glossy creamy-white faces, pale icy-blue lower facets, medium blue bevel/extrusion and deep navy outline. The attached perfect.png is STYLE REFERENCE ONLY for polished bevel quality; do NOT copy its gold color, sparkle stars or exclamation point. Primary request: render exactly the three words "TAP TO PLAY" in a SINGLE HORIZONTAL LINE, all uppercase, correct spelling with visible spaces. Wide landscape canvas, approximately 1536x512, complete lettering centered with just 5–8% transparent breathing room. Lettering occupies almost all usable width, straight baseline, upright readable thick letters with modest consistent 2.5D depth, no perspective distortion, at most a very slight playful curve. Front faces mostly creamy white, subtle pale-blue shading, a crisp saturated royal-blue bevel and dark navy outline that reads on bright sky and sunset backgrounds. It will be displayed about 280–350 CSS pixels wide. It is standalone lettering floating over game scenery: NO button, NO plate, NO rectangle, NO pill, NO banner, NO frame, NO surrounding badge, NO scenery, NO solid background, NO drawn checkerboard, NO coins, NO crown, NO stars, NO particles, NO finger/hand icon, NO other text. Keep actual alpha transparency around letters and inside letter holes; no broad atmospheric glow. Match the reference casual game finish while keeping this text subordinate to the title logo.
```

## 표시와 입력

- 문구는 정확히 TAP TO PLAY 한 줄이며 흰 얼굴·파란 베벨·짙은 파란 외곽선으로 기존 TOWER와 연결한다. 버튼 판·별·왕관·추가 안내는 없다.
- `assets.ts`의 필수 이미지 목록에 등록하고 Shell의 HTML 이미지로 표시한다. 사용자 요청으로 최초 표시의 가로·세로를 각각 50%로 줄였다(2026-10-12). `src/style.css`의 `.start-image img`가 표시 크기를 정하며, 글자의 실제 폭은 약 40cqw다. 중앙 위치와 폭 80cqw·높이 20cqw의 입력 영역은 유지한다. 원본 픽셀·알파는 유지한다.
- 화면의 파란 PLAY 판은 제거했다. 포커스·Enter/Space·접근성 이름을 보존하기 위해 판 없는 HTML button을 사용하며 접근성 이름은 Tap to play다. 메인 화면의 일반 캔버스 클릭/터치·문서 Space 시작도 유지한다. 시작과 첫 낙하는 별도 입력이다.
- 실제 화면 관측과 한계는 [검증 기록](../VALIDATION.md)을 따른다.

## 이용 조건

2026-10-12 확인한 [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/) Content 절은 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속한다. 입력 참조 권리와 서비스 이용 조건은 계속 적용되며 결과의 독점성을 보장하지 않는다. 실제 계정에 적용되는 계약 종류는 확인하지 않았다. 별도 제삼자 폰트는 추가하지 않았고 플랫폼 AI 생성물 공개 여부는 사용자가 결정한다.
