# CrazyGames Basic 요구사항 점검

확인일: 2026-10-14. 최신 로컬 CrazyGames 배포본 기준이다. 현재 포털에 올라간 빌드의 버전·재측정·QA 승인 상태는 직접 확인하지 않았다. 사용자가 정정한 Show QR Code는 점검 대상에서 제외한다.

2026-10-19 재신청 전 품질 검토와 최신 빌드/초기 전송 관측은 [품질 검토](quality-review-2026-10-19.md)를 따른다. 첫 세 권장 사항의 후속 구현과 최종 17.22MB 배포본·초기 전송 비교는 [최신 검증](VALIDATION.md)을 따른다. 아래 표는 2026-10-14의 당시 수치이며 현재 포털 측정으로 사용하지 않는다.

## 항목별 판단

| 항목                        | 상태                           | 근거·남은 작업                                                                                                                                                                                                                                                    |
| --------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial download size <50MB | 로컬 기준 충족                 | 현재 배포 전체 14,703,692 bytes. 주변 배경 적용 후 SDK fixture의 첫 PLAY 직후까지 로컬 전송은 17,774,167 bytes다. 재업로드 후 포털 수치를 확인한다.                                                                                                               |
| Gameplay requirements       | 최종 QA 필요                   | 영어 UI, PC 마우스/키보드·터치, 시작/낙하·실패·재시작·일시정지·기록, SDK 이벤트·음소거, CrazyGames 자체 전체화면 숨김을 확인했다. 모바일 텍스트 선택 차단 CSS도 적용했다. 원작성·가독성·재미·실제 고주사율/저사양 성능의 최종 판단은 플랫폼/사람 검증을 포함한다. |
| No external ads             | 충족                           | `gameConfig.services.ads`와 mock은 false, 실제 adapter는 Unavailable이며 광고 SDK 호출·외부 광고 UI·외부 광고 URL이 없다. Basic에서도 광고에 의존하지 않는다.                                                                                                     |
| No external login options   | 충족                           | 외부 로그인 UI·OAuth/API·계정 backend가 없고 게스트로 플레이한다. 브라우저 기록·재화·스킨 저장을 사용한다.                                                                                                                                                        |
| Smooth on iOS and Android   | Android 사용자 보고·iOS 미확인 | 사용자는 Android에서 상하 여백 외에는 괜찮다고 보고했다. 기기/빌드·플레이 조건은 미제공이며 FPS·메모리·백그라운드 복귀를 확인한 보고는 아니다. iOS Safari 실기기는 미확인이다. Chromium 터치 관측을 실기기 통과로 기록하지 않는다.                                |

## 보완과 기기 확인

- `src/style.css` body에 `user-select: none` / `-webkit-user-select: none` / `-webkit-touch-callout: none`을 적용했다. production preview PC·터치 에뮬레이션에서 드래그/긴 터치 뒤 선택 문자열이 비어 있고 입력이 유지됐다. 실제 Android 새 배포본과 Safari callout은 별도 확인한다. [최신 검증 기록](VALIDATION.md)을 따른다.
- safe-area inset과 `viewport-fit=cover`, 세로 FIT·작은 가로 창 배치는 구현돼 있다. 설치된 Phaser 4.2.1은 focus 시 suspended/interrupted AudioContext를 resume하는 코드를 포함한다. 실제 iOS의 통화·앱 전환 후 오디오/게임 복귀는 별도 확인한다.
- iPhone Safari와 Android Chrome에서 새 Preview를 열고 5·10·20개·시간대 전환, 실패/재시작, SHOP 구매/재접속, 음소거, 앱 전환 후 정지/재개, 긴 터치/세로·가로 표시를 확인한다. 기기/OS/브라우저·도달 구간·버벅임/입력 누락 여부를 기록한다.
- Android 사용자 피드백은 [플레이 관측](PLAYTEST_NOTES.md)에 기록했다. 상하 여백은 기존 배경의 확대·블러로 채웠고 로컬 PC/터치에서 시간대·정지/재시작 동기화를 관측했다. 실제 Android에서 개선 후 미감·합성 성능은 아직 확인하지 않았다. 이 문서는 제한된 긍정 보고를 전체 기기 성능 통과로 바꾸지 않는다.

## 실행 근거

- 주변 여백 개선 후 PC/터치에서 5/10/15/20개·정지/카운트다운·결과/재시작·크기/전체화면을 관측했다. 최종 구현은 Phaser Image 요소를 재사용해 배경 중복 네트워크 요청을 없앴다. 현재 용량과 관측 조건은 [최신 검증 기록](VALIDATION.md)을 따른다.

- 선택 방지 후 `lint`, `format:check`, `build:crazygames`를 통과했다. SDK-fixture preview PC/터치 관측에서 드래그/750ms 홀드의 선택 없음, SHOP·소리·시작/첫 낙하·정지/메뉴, 페이지/HTTP 오류 0건을 확인했다. `test-results/selection-prevention/`에 기록했으며 새 회귀 스위트 실행은 아니다. 아래 정식 검사 결과는 앞선 Basic 점검 시점의 결과다.

- `rtk npm run check`: 첫 실행은 audio/SDK 단위 검사 두 파일의 브라우저 전용 Phaser import 때문에 실패했다. 단위 검사에서 Phaser 이벤트 의존성을 mock으로 격리한 뒤 **6개 파일/67개 검사·lint·format·TypeScript·일반 빌드 통과**를 확인했다.
- 개발 SDK 검사: **14개 fixture 통과 / 공식 SDK 2개 미설정 skip**. 이어서 공식 v3 파일을 수정 없이 내려받아 배포본 검사에 포함했다.
- CrazyGames production 검사: **16/16 통과**(fixture 14개 + 실제 공식 SDK local 환경 2개). 초기화, 플레이 이벤트, 수동 정지/카운트다운, 실패·재시작·메뉴, 플랫폼 음소거·저장 유지, SDK 실패·disabled, 821×462 영어 UI·전체화면 숨김을 포함한다. 실제 CrazyGames 호스트에서의 승인을 증명하지 않는다.
- 공식 SDK 다운로드: 112,919 bytes, SHA-256 `d4c44671cafbb694a0fd054078303242681bdf1b5908d6fb9f766d1de3f25911`. CDN major v3만 고정돼 있고 미래 파일 내용은 변할 수 있다. `CG_SDK_FILE=/private/tmp/coin-basic-official-sdk.js`로 local 환경을 검사했다.
- standalone 전체 개발 검사 첫 실행: **24/30 통과**, 이전 `.blue-panel` 선택자와 v4의 보유/장착 필드를 반영하지 않은 검사 3종이 PC·터치 양쪽에서 실패했다. 실제 표시·저장 형식에 맞춰 기존 검사를 보완하고 해당 6건을 별도 재실행해 **6/6 통과**했다. 전체 30건을 다시 실행한 결과와는 구분한다. 결과는 [검증 기록](VALIDATION.md)을 따른다.
- 기존 개발/preview 프로세스와 충돌하지 않도록 /private/tmp 설정에서 포트만 5273/5274/5275로 바꿨다. 원본 검사 프로젝트·기본 타임아웃·worker 수를 유지했다. 명령은 `rtk proxy npx playwright test --config <임시 설정>`이며 배포 검사에 `E2E_PREVIEW=1`·`CG_SDK_FILE`을 지정했다.
- 산출물은 `test-results/basic-audit-standalone/`, `basic-audit-standalone-rerun/`, `basic-audit-crazygames/`, `basic-audit-production/`이다. 실기기·Safari/WebKit·Firefox 검사 산출물은 없다.

## 공식 기준

- [요구사항 요약](https://docs.crazygames.com/requirements/intro/): Basic 기술·광고·계정 기준.
- [기술·모바일 기준](https://docs.crazygames.com/requirements/technical/): 초기 크기·기기·모바일 선택 방지·SDK.
- [Gameplay 기준](https://docs.crazygames.com/requirements/gameplay/): 영어·가독성·입력·성능·전체화면·외부 홍보·콘텐츠.
- [광고 기준](https://docs.crazygames.com/requirements/ads/), [계정 기준](https://docs.crazygames.com/requirements/account-integration/).
