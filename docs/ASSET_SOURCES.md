# 자산 출처

## 모바일에서 재사용한 아트

사용자가 기존 모바일 아트를 재사용하도록 요청한 범위다. 원본은 `../coin-tower-mobile/game/assets/`의 PNG이며 원본 `docs/ART_DIRECTION.md`에 사용자 목업을 참고해 생성한 이미지와 프롬프트가 기록되어 있다. 별도의 제삼자 라이선스 파일은 제공되지 않았으며 이번 사용자 요청을 재사용 근거로 기록한다.

PNG는 수정 없이 복사했다. 원본과 아래 파일의 SHA-256이 일치한다. 투명 여백은 `src/game/assets.ts`의 frame 정의와 CSS 배치로 처리한다.

| 웹 파일                                  | 용도                | SHA-256                                                            |
| ---------------------------------------- | ------------------- | ------------------------------------------------------------------ |
| `public/assets/coin-tower/coin.png`      | 이동·낙하·적층 금화 | `91e566353d7dd22f0cb9db8687a873ec15191abbb6997635080fa6429b54019e` |
| `public/assets/coin-tower/pedestal.png`  | 첫 동전 받침대      | `cebb01a3bfd2cf05daad4a8f215131f7fba3e347a7df70cd24a7262ad9dc236a` |
| `public/assets/coin-tower/sky_ruins.png` | 세로 배경           | `7939e2a463b49bb89820ac8dac8c6c3286d938e37fb0bb95d2bd233d1cd18987` |
| `public/assets/coin-tower/hud_panel.png` | HUD·버튼 공용 판    | `50fb06aa4615c405d040ddcdd65335e6acf505cddfdbe7fabcf8a3fd4076497f` |
| `public/assets/coin-tower/logo.png`      | 시작·플레이 로고    | `4a34c9f18a5a012e1ff0cb5d7600c7d134316e93f6102b367ecaec0fac49171e` |
| `public/assets/coin-tower/perfect.png`   | 정밀 착지 피드백    | `17cb5cbb67eecabbf7a86fdd5c69da9f1cd743c8e61c71d1f7fe4b72eb250bba` |
| `public/assets/coin-tower/nice.png`      | 일반 성공 피드백    | `a0d21cc3ab54c432f735628dc94c20f6408d59f581755fc9bb517320d840987b` |
| `public/assets/coin-tower/game_over.png` | 결과 제목           | `9d9af9bc28ed3d07d2a5221e698200b2030fc6086646477c556ef40bc82da501` |
| `public/assets/coin-tower/paused.png`    | 일시정지 제목       | `99fd66970def663737b10808ca0142e896f3a7e8b90fa66a12637b709824c9fc` |

## 동전 스킨 3종

- 파일: `public/assets/coin-tower/skins/coin_silver.png`, `coin_ruby.png`, `coin_emerald.png`. 상태: 제작 완료·실제 구매/장착 기능 적용 전. 기존 `coin.png`는 보존했다.
- 출처: 2026-10-13 OpenAI 내장 `image_gen.imagegen` 참조 이미지 편집, 스킨당 한 번씩 총 3회. 상세 모델 버전·seed는 제공되지 않았다. 참조는 기존 `coin.png` 하나이며 `transparent_background: true`를 사용했다.
- 원본과 같은 1599×984 RGBA PNG를 그대로 복사했으며 픽셀·알파 후처리는 없다. 전체 프롬프트·원본 경로·해시·표시 frame·용량·관측은 [제작 기록](art/coin-skins.md)에 있다.
- 이용 조건 확인(2026-10-13): [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/) Content 절에 따라 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속한다. 입력 참조 권리·서비스 이용 조건은 계속 적용되며 결과의 독점성은 보장되지 않는다. 실제 계정 계약 종류는 미확인이다. 플랫폼의 AI 생성물 공개 여부는 사용자가 결정한다.

## 웹 Perfect 콤보 숫자

- 파일: `public/assets/coin-tower/combo/x.png`, `0.png`~`9.png`의 11개. 상태: 플레이에 사용하는 생성 아트. 원본 `perfect.png`는 유지한다.
- 출처: 2026-10-08 OpenAI 내장 `image_gen.imagegen`으로 AI 생성. 정확한 모델 버전·seed는 비공개. 참조 입력·전체 프롬프트·원본 SHA-256·분리 영역은 [제작 기록](art/combo-glyphs.md)에 있다.
- 지시: 기존 Perfect와 같은 금색 둥근 입체 글자·적갈색 테두리로 X와 0~9를 투명 배경에 생성. 추가 별·후광은 넣지 않는다.
- 후처리: Chromium Canvas로 글자별 영역 분리, 높이 192px의 비례 축소·투명 여백 정리. 색·글자 재도색 없음. 방향 기준은 [ART_DIRECTION.md](ART_DIRECTION.md)다.
- 이용 조건 확인(2026-10-08): [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/) Content 절은 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속한다. 서비스 이용 조건과 입력 참조 권리는 계속 적용된다. 별도 제삼자 폰트는 사용하지 않았다. 플랫폼의 AI 생성물 공개 여부는 사용자가 제출 단계에서 결정한다.

## 시간대 배경 변형

- 파일: `public/assets/coin-tower/backgrounds/sky_ruins_noon.png`, `sky_ruins_evening.png`, `sky_ruins_night.png`. 상태: 플레이에 사용하는 생성 아트. 기존 아침 배경은 수정하지 않았다. 런타임 전환과 관찰 한계는 [시간대 배경](design/backgrounds.md)과 [검증 기록](VALIDATION.md)을 따른다.
- 출처: 2026-10-09 OpenAI 내장 `image_gen.imagegen` 참조 이미지 편집. 입력은 위 모바일 재사용 배경 `sky_ruins.png`다. 모델 상세 버전·seed는 제공되지 않았다.
- 지시: 같은 장면의 큰 구도·유적·폭포·빈 하늘을 유지하며 점심·저녁·밤의 색과 조명으로 변형한다. 투명 배경·새 물체·문자·UI는 넣지 않는다.
- 후처리: 없음. 생성 PNG를 그대로 복사했다. 실제 크기는 점심·밤 941×1672, 저녁 941×1671이다. 전체 프롬프트·파일 해시·비교 결과·런타임 관찰 한계는 [제작 기록](art/background-time-of-day.md)에 있다.
- 이용 조건 확인(2026-10-09): [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/) Content 절은 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속한다. 참조 입력을 사용할 권리가 필요하며 결과의 독점성은 보장되지 않는다. 기존 아트 재사용은 위 사용자 요청을 근거로 한다.

## 기록·별조각 아이콘

- 파일: `public/assets/coin-tower/icons/best-coins.png`, `best-combo.png`, `star-shards.png`. 상태: 메뉴·결과·인게임 UI에서 사용하며 필수 자산 로더에 등록했다. 원본 픽셀은 보존하고 CSS로 표시 크기와 투명 여백만 조정한다.
- 출처: 2026-10-12 OpenAI 내장 `image_gen.imagegen`으로 AI 생성. 모델 상세 버전·seed는 비공개. 참조는 기존 `coin.png`와 `perfect.png`다.
- 지시: 왕관이 있는 금화 탑, 연결된 금빛 Perfect 섬광, 청록색 별 결정의 서로 다른 실루엣을 기존 광택·베벨 스타일로 제작. 글자·배경 없이 실제 알파 투명도로 생성했다.
- 출력·후처리: 각 1254×1254 RGBA PNG. 생성 원본을 바이트 그대로 복사했으며 후처리 없음. 전체 프롬프트·원본 경로·해시·파일 크기·축소 관측은 [제작 기록](art/ui-icons.md)에 있다.
- 이용 조건 확인(2026-10-12): [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/) Content 절은 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속한다. 입력 참조 권리·서비스 이용 조건은 계속 적용되며 결과의 독점성은 보장되지 않는다. 실제 계정 계약 종류는 미확인이다. 플랫폼의 AI 생성물 공개 여부는 사용자가 제출 단계에서 결정한다.

## TAP TO PLAY 시작 글자

- 파일: `public/assets/coin-tower/tap_to_play.png`. 상태: 메인 화면에 사용하는 투명 이미지 글자이며 필수 자산 로더에 등록했다.
- 출처: 2026-10-12 OpenAI 내장 `image_gen.imagegen` 기본 도구로 한 번 생성. 상세 모델 버전·seed는 제공되지 않았다. 참조는 기존 `logo.png`·`perfect.png`이며 파일 원본은 보존했다.
- 지시: TAP TO PLAY 한 줄을 기존 TOWER의 흰 얼굴·파란 베벨·짙은 외곽선으로 생성. 버튼 판·배경·장식 별·왕관·추가 문구는 제외했다.
- 출력·후처리: 2172×724 RGBA PNG·812,872 bytes, 생성 원본 그대로 복사. 픽셀 후처리 없이 CSS로 표시 영역의 투명 여백만 제외한다. 전체 프롬프트·원본 경로·해시·표시 사양은 [제작 기록](art/tap-to-play.md)에 있다.
- 이용 조건 확인(2026-10-12): [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/) Content 절에 따라 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속한다. 입력 참조 권리·서비스 이용 조건은 계속 적용되며 결과의 독점성은 보장되지 않는다. 실제 계정 계약 종류는 미확인이다. 플랫폼의 AI 생성물 공개 여부는 사용자가 결정한다.

## 효과음과 기타

- `public/assets/coin-tower/stack.wav`: phaser-web-template 0.2.0, commit `b953c81b31cfdb36f73c6462d707a45ec2b8a46d`의 `public/assets/demo/collect.wav`를 재사용한 합성 효과음. 템플릿은 직접 합성한 WAV라고 기록한다. 현재 착지 소리용 임시 음원이며 BGM은 없다.
  - 착지 연출 개선에서도 파일 원본은 유지한다. 일반/Perfect에 다른 재생 속도와 상대 음량을 적용하며 조정값은 `src/game/feedback.ts`를 따른다. 별도 금속음 녹음·AI 생성이나 외부 음원 추가는 하지 않았다.
- `public/favicon.svg`: 이 프로젝트 초기화 중 작성한 SVG.
- 신규 생성 이미지는 위 콤보 숫자·시간대 배경·기록/별조각 아이콘·TAP TO PLAY 글자다. 외부 폰트·제삼자 음원은 추가하지 않았다.

첫 플레이 버전은 이미지 원본을 보존한다. 파일 크기와 실제 휴대폰 첫 로딩 시간은 후속 기기 플레이에서 함께 관찰한다.
