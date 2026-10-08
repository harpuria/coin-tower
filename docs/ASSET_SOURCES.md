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

## 웹 Perfect 콤보 숫자

- 파일: `public/assets/coin-tower/combo/x.png`, `0.png`~`9.png`의 11개. 상태: 플레이에 사용하는 생성 아트. 원본 `perfect.png`는 유지한다.
- 출처: 2026-10-08 OpenAI 내장 `image_gen.imagegen`으로 AI 생성. 정확한 모델 버전·seed는 비공개. 참조 입력·전체 프롬프트·원본 SHA-256·분리 영역은 [제작 기록](art/combo-glyphs.md)에 있다.
- 지시: 기존 Perfect와 같은 금색 둥근 입체 글자·적갈색 테두리로 X와 0~9를 투명 배경에 생성. 추가 별·후광은 넣지 않는다.
- 후처리: Chromium Canvas로 글자별 영역 분리, 높이 192px의 비례 축소·투명 여백 정리. 색·글자 재도색 없음. 방향 기준은 [ART_DIRECTION.md](ART_DIRECTION.md)다.
- 이용 조건 확인(2026-10-08): [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/) Content 절은 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속한다. 서비스 이용 조건과 입력 참조 권리는 계속 적용된다. 별도 제삼자 폰트는 사용하지 않았다. 플랫폼의 AI 생성물 공개 여부는 사용자가 제출 단계에서 결정한다.

## 효과음과 기타

- `public/assets/coin-tower/stack.wav`: phaser-web-template 0.2.0, commit `b953c81b31cfdb36f73c6462d707a45ec2b8a46d`의 `public/assets/demo/collect.wav`를 재사용한 합성 효과음. 템플릿은 직접 합성한 WAV라고 기록한다. 현재 착지 소리용 임시 음원이며 BGM은 없다.
- `public/favicon.svg`: 이 프로젝트 초기화 중 작성한 SVG.
- 위 콤보 숫자 외 신규 이미지·외부 폰트·제삼자 음원은 추가하지 않았다.

첫 플레이 버전은 이미지 원본을 보존한다. 파일 크기와 실제 휴대폰 첫 로딩 시간은 후속 기기 플레이에서 함께 관찰한다.
