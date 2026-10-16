# Coin Tower 웹 검증

이 문서는 이 프로젝트에서 실제 실행한 결과만 기록합니다. 템플릿 자체의 과거 검증은 [template/VALIDATION.md](template/VALIDATION.md)에 있습니다.

## 2026-10-17 — 첫 품질 개선 구현·PC/터치/배포 검증

- 범위: 확정한 첫 품질 개선의 로고·본문/버튼 크기·집중형 HUD, 실제 플레이 안내, 실패 동전 표현, 다음 높이/스킨 목표, 결과 SHOP/BACK을 구현했다. 새 래스터·오디오·의존성은 없으며 직접 작성한 손 제스처 SVG와 기존 아트 crop을 사용한다. [ADR 0007](adr/0007-complete-runs-before-result-presentation.md)에 완료/표현·안내 저장·상점 복귀 계약을 기록했다.
- 상태/저장: 첫 실패에서 records/rewards를 한 번 정산하고 모델 시간으로 결과 표시를 지연한다. 백그라운드에서 지연을 멈춘다. v5의 안내 완료는 다섯 번째 성공 또는 SKIP 때 별도로 저장하며 중단 판의 기록·보상은 저장하지 않는다. v1–v4 이행·잘못된 collection·손상/미래 버전·quota 원본 보호를 확인했다. 결과 구매 후 TOTAL/목표는 갱신하지만 EARNED·기록 경신·완료 탑 외형은 유지하며 다음 판부터 새 스킨을 적용한다.
- 정적 검사: 최종 `rtk npm run check`의 lint·format·단위 검사 **89/89(7개 파일)**·TypeScript·일반 빌드가 통과했다. 일반 dist는 **14,803,681 bytes**다. 기존 검사 기대값을 v5와 실패 표시 구간에 맞춰 갱신하고 목표 계산/추천·안내 독립 저장·완료 한 번 정산·상점 복귀의 회귀 검사를 추가했다.
- standalone 개발: 전체 `rtk npm run test:e2e` 실행은 **38/40 통과**(11.0분)했다. 실패한 PC/터치 두 건은 v2 이행 기대값에서 새 `onboardingComplete: false`가 빠진 검사였고 수정했다. 수정 및 상점 BACK 포커스·완료 탑 스킨 보존 보완 뒤 `--grep 'quality:|v1 migration'` 재실행은 **12/12 통과**(2.3분)했다. 앞선 품질/정지 집중 실행도 **14/14 통과**(4.2분)했다. 전체 실행과 부분 재실행을 합쳐 40/40의 새 전체 실행으로 표현하지 않는다.
- standalone production: 일반 빌드에서 `rtk proxy env E2E_PREVIEW=1 npm run test:e2e`가 **24 통과 / 16 조건부 skip**(2.4분)했다. skip은 개발 시간 훅에 의존하는 관측이며 production에 훅을 넣지 않았다. 실제 마우스/Space·터치 입력과 브라우저 시간 제어로 완료/재시작·안내/저장·결과/구매·작은 화면·오류 처리를 확인했다. 이 실행의 캡처에서 발견한 저장 불가 안내/작은 로고 겹침을 마지막 CSS 조정으로 분리했다. 최종 일반 빌드의 `--grep 'quality: (result delay|unavailable)'` 재검사는 **4/4 통과**(18.3초)했다. 상점·BACK·SKIP·TRY AGAIN 등의 모바일 버튼을 실제 터치 탭으로 강화한 검사이며 작은 로고와 저장 안내의 분리도 캡처로 재확인했다.
- CrazyGames 개발: `rtk proxy env CG_SDK_FILE=/private/tmp/coin-tower-quality-sdk-v3.js npm run test:crazygames`는 **26/26 통과**(3.6분)했다. 통제 fixture 24개와 수정 없는 공식 SDK local 2개다. 새 품질 흐름과 기존 start/stop·플랫폼 mute·SDK download/init/disabled 오류·작은 포털 프레임을 포함한다. 개발 실행 후 공용 품질 검사의 모바일 버튼 입력도 실제 터치 탭으로 강화했다.
- CrazyGames production: `rtk npm run build:crazygames`의 TypeScript·빌드가 통과했다. 이어 `rtk proxy env E2E_PREVIEW=1 CG_SDK_FILE=/private/tmp/coin-tower-quality-sdk-v3.js npm run test:crazygames`는 **24 통과 / 2 조건부 skip**(2.0분)했다. fixture 22개·공식 SDK local 2개이며 skip 2개는 개발 훅이 필요한 20개 관측이다. 새 품질 흐름의 모바일 캔버스·상점·BACK·SKIP·재시작 버튼은 실제 터치 탭으로 확인했다. 배포본의 개발 훅 제외·자체 fullscreen 숨김과 기존 SDK 회귀도 유지된다. 최종 dist는 **14,708,911 bytes(14.71MB), 39개 파일**, 원본 PNG는 없다. 이번 작업에서 초기 네트워크 전송량이나 포털 Load를 새로 측정한 것은 아니다.
- 공식 SDK: 2026-10-17에 `https://sdk.crazygames.com/crazygames-sdk-v3.js`를 새로 내려받아 수정 없이 `CG_SDK_FILE=/private/tmp/coin-tower-quality-sdk-v3.js`로 공급했다. **112,919 bytes**, SHA-256 `d4c44671cafbb694a0fd054078303242681bdf1b5908d6fb9f766d1de3f25911`. fixture의 통제된 start/stop/mute/error 검증과 공식 SDK의 local 환경 init/정지/재개 검증을 구분한다.
- 환경/관측: Chromium PC 1280×900 DPR1·Pixel 7 터치 에뮬레이션 412×839 DPR2.625. 개발 관측은 실제 입력과 시간 훅으로 NICE·Perfect·5/10/20개·네 시간대·좌우 실패·reduced motion을 확인하고 점수/좌표를 덮어쓰지 않았다. 360×640·390×844·821×462·907×510의 결과 배치, 본문 시작 기준·44px 조작 크기·페이지 overflow와 캡처를 확인했다. 정상 품질 경로의 pageerror는 없었으며 의도한 SDK 실패 fixture의 warning은 오류 경로 검증과 구분한다.
- 산출물: 일반 개발/배포 캡처는 `test-results/standalone/`, CrazyGames 캡처는 `test-results/crazygames/`에 기록한다. 검사 재실행은 같은 경로를 덮어쓴다. 최종 개발의 20개·좌우 실패·reduced motion·작은 화면·구매 후 완료 탑 캡처는 `test-results/quality-final/crazygames-development/`에 별도 보존했다. 최종 CrazyGames 배포 캡처는 `test-results/quality-final/crazygames-production/`, 마지막 일반 배포 집중 캡처는 `test-results/quality-final/standalone-final-focused/`에 보존했다. 이 디렉터리들은 Git에서 제외한다.
- 문서 검사: 변경한 프로젝트 내부 링크·제목 앵커 262개와 `git diff --check`를 확인했다. 원본 모바일 프로젝트를 가리키는 기존 외부 형제 경로 4개는 현재 워크스페이스에서 확인할 수 없으며 새 링크 검증과 구분한다.
- 한계: 터치 에뮬레이션은 실제 Android/iPhone 검증이 아니다. Safari/WebKit·Firefox·저사양/고주사율 기기, 실제 CrazyGames Preview/CDN·포털 Load 측정·재심사 통과는 미확인이다. 첫 플레이 이해도·가독성 체감·실패 납득·재도전 동기·첫 구매까지의 판 수는 [사람 플레이 과제](PLAYTEST_NOTES.md#2026-10-17--첫-품질-개선의-입력저장목표-흐름)로 남겼다. 업로드나 리뷰 제출은 수행하지 않았다.

## 2026-10-17 — 첫 품질 개선 설계 확정

- 작업 범위: 사용자가 확정한 세로 화면 가독성·집중형 HUD·실패 연출·첫 플레이 안내·결과 목표·상점 복귀를 설계 문서와 [구현 계획](IMPLEMENTATION_PLAN.md#quality-improvement--first-implementation-slice-implemented)에 반영했다. 새 안내 문서는 [onboarding.md](design/onboarding.md)다. 코드·런타임 자산·의존성은 변경하지 않았다.
- 검사: `rtk npm run check`의 lint·format·기존 67개 단위 검사(6개 파일)·TypeScript·일반 빌드가 통과했다. `rtk npm run build:crazygames`도 통과해 마지막 배포 산출물은 CrazyGames 모드다. 문서 변경의 공백 오류와 프로젝트 내부 링크·제목 앵커를 확인했다.
- 한계: 이 결과는 현재 코드의 기존 검사·빌드 통과다. 새 설계의 UI·안내 저장·실패 연출·목표·상점 복귀는 아직 미구현이며 이번 작업에서 E2E·SDK 브라우저 검사나 사람 플레이를 새로 실행하지 않았다. 개선된 가독성·실패 납득·재도전 효과와 실제 포털 재심사는 구현 후 확인해야 한다.

## 2026-10-14 — 상하·좌우 여백 배경

- 구현: `Shell`의 fixed 장식 레이어 두 개가 Phaser Texture의 기존 Image 요소를 재사용한다. 새 URL 로딩·Blob 생성 없이 주변 영역만 CSS cover·블러로 표시한다. 게임 안팎은 같은 Session 상태와 `backgroundAlpha()`를 사용한다. 표현 기준은 [아트 방향](ART_DIRECTION.md#플레이-영역-바깥-배경)에 있다.
- 개발 관측: Chromium PC 1280×900 DPR1·Pixel 7 터치 에뮬레이션 412×839 DPR2.625에서 마우스/Space·실제 터치와 개발 시간 제어로 20개/X19까지 진행했다. 5/10/15/20개 전환 시작·50%·완료 때 주변 alpha와 Scene alpha가 일치했고, 5개 50%에서 정지·카운트다운 동안 0.5를 유지한 뒤 완료했다. 실패·TRY AGAIN·메뉴 복귀 시 상태도 일치했다. 점수·동전 좌표를 덮어쓰지 않았다.
- 배치: 주변 레이어는 viewport 전체, 게임 영역은 PC 497.25×884·터치 412×732.4375로 유지됐다. 360×640·821×462·PC standalone 전체화면에도 배경이 채워졌고 페이지 overflow는 없었다. PC·모바일 메뉴, 밤 배경·전체화면 캡처를 시각적으로 확인했다. 장식 레이어가 포인터 타깃이 되지 않았다.
- 배포 관측: CrazyGames production preview·SDK fixture에서 PC/터치 SHOP·복귀·소리·시작 후 별도 첫 낙하 1개·정지, init/start/stop, 자체 전체화면 숨김·개발 훅 제외를 관측했다. 정상 개발/배포 경로의 페이지·HTTP 오류는 0건, 표시 중 이미지의 미로딩은 없었다.
- 초기 전송 관측: 최초 URL 구현에서 아침 이미지가 HTML/Phaser로 중복 요청됐다. Image 요소 재사용으로 바꾼 최종 preview의 새 세션에서 네 배경은 각 XHR 한 번이며 추가 Image 네트워크 요청이 없었다. SDK fixture·첫 PLAY 직후까지 CDP loadingFinished 합계는 PC/터치 모두 **17,774,167 bytes(17.77MB)**다. 포털/CDN 압축·공식 SDK 전송·실기기 성능 수치는 아니다.
- 프로젝트 검사·빌드: `rtk npm run check`의 lint·format·67개 단위 검사(6개 파일)·TypeScript·일반 빌드를 통과했다. 이어 `rtk npm run build:crazygames`도 통과했다. 최종 dist는 **14,703,692 bytes(14.70MB)**로 직전 선택 방지 산출물 대비 1,442 bytes 증가했고 새 이미지 파일은 없다.
- 기존 배경 회귀 검사: `backgrounds.spec.ts`의 PC/터치 **4/4 통과**(2.6분). 5/10/15/20/25개·중간 정지/카운트다운·확인 취소/재시작/메뉴·중간 실패/TRY AGAIN·실시간 전환을 포함한다. 임시 설정은 기존 프로젝트/worker/timeout을 유지하고 실행 중인 5283 개발 서버 및 별도 `test-results/ambient-backdrop-regression/`만 지정했다. 실행은 `rtk proxy npx playwright test backgrounds.spec.ts --config /private/tmp/coin-backdrop.playwright.config.ts`다.
- 산출물: `test-results/ambient-backdrop/`의 PC/터치 전후 메뉴·구간·정지·결과·재시작·화면 크기 PNG, `observations.json`(49개 관측 항목), `network.json`. 초기 관측의 SHOP 복귀 후 Space는 포커스된 SHOP을 활성화하므로 시작 버튼으로 준비 입력을 수정해 재실행했다. 최종 Image 요소 재사용 변경 후 전체 관측을 다시 수행했다. 새 테스트는 추가하지 않았다.
- 한계/다음: 실제 Android/iOS·CrazyGames 호스트·저사양에서 블러 합성 성능과 사용자 미감은 미확인이다. 새 dist를 업로드하고 Android에서 주변 연결·5/10/15개 시간대·입력 지연 여부를 다시 확인하면 이번 사용자 피드백을 평가할 수 있다.

## 2026-10-14 — 모바일 선택 방지 CSS

- 변경: `src/style.css` body에 `user-select: none`, `-webkit-user-select: none`, `-webkit-touch-callout: none`을 추가했다. 화면 비율·게임 규칙은 그대로다. Android 사용자 피드백과 여백 개선 제안은 [플레이 관측](PLAYTEST_NOTES.md)에 기록했다.
- 실행: `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build:crazygames`(TypeScript 포함)를 통과했다. 최종 CrazyGames dist는 14,702,250 bytes다. 이전 초기 전송 측정은 새 CSS를 포함한 재측정과 구분한다.
- 관측: production preview·SDK fixture에서 Chromium PC/Pixel 7 터치 에뮬레이션을 실제 입력으로 조작했다. body·canvas 영역·SHOP·안내·소리 버튼의 computed standard/WebKit userSelect가 none이며, 안내를 가로지르는 드래그와 터치 750ms 홀드 이후 선택 문자열이 비어 있었다. SHOP 열기/복귀·소리·시작 후 별도 낙하로 1개·일시정지·메뉴 복귀, SDK init/start/stop·자체 전체화면 숨김을 관측했다. 점수·좌표·개발 훅을 사용하지 않았고 정상 페이지/HTTP 오류는 양쪽 모두 0건이었다.
- 산출물: `test-results/selection-prevention/observations.json`과 PC/터치 메뉴·드래그·긴 터치·소리·정지·복귀 PNG. 회귀 스위트를 추가하거나 실행하지 않은 관측이다.
- 한계: 실제 Android 새 배포본의 선택 방지·iOS Safari/WebKit callout·물리 기기 성능·포털 QA는 확인하지 않았다. 사용자 Android 긍정 피드백은 CSS 적용 전 별도 보고이며 기기/플레이 조건이 제공되지 않았다.

## 2026-10-14 — Basic 요구사항 점검·회귀 검사

- 사용자 요청에 따라 다운로드·Gameplay·외부 광고·외부 로그인·iOS/Android 원활한 플레이를 공식 문서와 대조했다. QR Code는 사용자 정정으로 제외했다. 항목별 판정과 남은 작업은 [Basic 점검](basic-launch-readiness.md)에 있다. 실제 포털 빌드·QA 상태는 열람하지 않았다.
- 정적 확인: 외부 광고/로그인 UI·SDK/API가 없고 해당 서비스와 Mock이 꺼져 있다. 영어 UI·마우스/키보드/터치·세로 FIT·safe area·플랫폼 전체화면 숨김이 구현돼 있다. body의 `user-select: none`/`-webkit-user-select: none` 누락을 발견해 보완 항목으로 기록했으며 게임 CSS는 변경하지 않았다.
- `rtk npm run check` 첫 실행은 브라우저 전용 Phaser가 두 Node 단위 검사에서 import돼 중단됐다. 두 검사에 Phaser 이벤트 mock을 넣어 격리한 뒤 **67개 단위 검사(6개 파일)·lint·format·TypeScript·일반 빌드 통과**를 확인했다. 게임 소리/SDK 구현은 변경하지 않았다.
- standalone 개발 브라우저 전체 실행은 **24/30 통과**했다. 이전 `.blue-panel` 선택자와 v4 보유/장착 필드가 반영되지 않은 기존 검사 3종이 각 PC·터치에서 실패했다. 버튼/기록 readout 선택자·표시 숫자 overflow 확인·저장 기대값을 현재 구현에 맞춰 갱신했고, 해당 6건 재실행은 **6/6 통과**했다. 전체 실행과 부분 재실행을 합쳐 새 전체 실행 통과로 표현하지 않는다.
- 개발 CrazyGames는 **14 fixture 통과 / 2개 공식 SDK 조건부 skip**. 현재 CDN에서 공식 v3 파일(112,919 bytes)을 수정 없이 내려받아 production preview에 사용한 별도 실행은 **16/16 통과**(fixture 14 + 공식 SDK local 2)했다. 플레이 이벤트·정지/재개·실패·메뉴/재시작·플랫폼 음소거·저장 보존·실패 처리·영어/821×462·전체화면 숨김을 확인했다. 공식 SDK의 실제 CrazyGames 호스트 통과를 뜻하지 않는다.
- 기존 개발/preview 서버를 유지하려고 임시 Playwright 설정의 포트만 5273/5274/5275로 바꿨다. 산출물은 `test-results/basic-audit-standalone/`, `basic-audit-standalone-rerun/`, `basic-audit-crazygames/`, `basic-audit-production/`이다. 공식 SDK 해시와 명령 조건은 [점검 기록](basic-launch-readiness.md)을 따른다.
- 최종 dist는 CrazyGames 모드·14,702,181 bytes다. 직전 최적화에서 관측한 SDK fixture cold-first-gameplay 전송은 17,807,713 bytes이며 이번 점검에서 수치를 새로 측정한 것과 구분한다.
- 한계: iPhone Safari·Android Chrome 실기기·Safari/WebKit/Firefox·물리 고주사율/저사양 기기 성능·포털의 QA·원작성/가독성 최종 심사는 미확인이다. Chromium 터치 에뮬레이션을 실제 iOS/Android 성능 통과로 기록하지 않는다. 전체 충족으로 체크하려면 모바일 선택 방지 보완과 실제 기기/포털 확인이 필요하다.

## 2026-10-14 — 원본 보존·배포 WebP·20MB 이하 최적화

- 요청/기준: 사용자가 CrazyGames 포털 Total 26.6MB / Load 24MB / 모바일 홈페이지 20MB 초과 안내를 보고했다. 이는 사용자 보고이며 로컬 측정과 구분한다. 기존 로컬 dist는 27,870,719 bytes(26.58MiB)였다.
- 원본/변환: PNG 35장의 Git 원본 SHA-256을 모두 보존했다. 배포 WebP 합계는 13,355,598 bytes다. 아이콘 8장만 384px/256px로 축소하고 나머지 27장은 해상도와 전체 디코딩 픽셀이 같다. 모든 파생 파일은 준비한 픽셀과 무손실 디코딩 결과가 같다. 알파·frame 좌표·CSS 비율 crop을 유지했다. [파일별 기록](../src/game/art-generated.json)·[재생성 절차](art/optimized-assets.md)를 따른다.
- 빌드: 일반 배포 14,796,951 bytes / CrazyGames 배포 **14,702,181 bytes**(14.70MB, 약 14.02MiB). 최종 dist는 39개 파일이며 원본 PNG와 fullscreen 아이콘은 없다. Vite는 등록 WebP·WAV·favicon만 복사하고 해시/설정 불일치·20,000,000 bytes 이상 CrazyGames 산출물을 실패시킨다.
- 정적 검사: `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build`, `rtk npm run build:crazygames`(두 빌드 모두 TypeScript 포함)를 통과했다. 이미지 재생성 명령도 실제 실행했다. 최종 dist는 CrazyGames 모드다.
- 개발 장면 비교: 실제 PC 1280×900 DPR1·Pixel 7 터치 에뮬레이션 DPR2.625에서 보존 PNG를 이미지 응답으로 대체한 기준 장면과 WebP 장면을 비교했다. 메뉴·SHOP·확인/취소·세 스킨 구매·20개/X19·네 시간대 배경·전환 중 pause/countdown·결과/+20·재시도·재시작·메뉴·전체화면·360×640/821×462를 캡처했다. 시간 훅만 사용하고 점수·동전 좌표는 덮어쓰지 않았다. 정상 페이지·자산 HTTP 오류는 0건이었다. 픽셀 동일성은 비축소 아트의 파일 디코딩 비교이며 전체 화면 픽셀 동일성 주장은 아니다.
- 일반 production preview: PC·터치에서 실제 전체화면 진입/해제와 256px WebP 상태 전환, SHOP·소리·별도 시작/첫 적층 1개를 관측했다. 개발 훅은 제외됐다. 필수 coin.webp 누락은 로딩 오류와 PLAY/SHOP 비활성화를 유지했다.
- CrazyGames production preview: SDK fixture와 실제 시간 입력을 사용했다. 플랫폼 음소거·자체 전체화면 숨김·개발 훅 제외, 1개 완료/+1 후 은화 구매(75→76→26)·자동 장착·재접속 복원·재시작을 관측했다. 원본 PNG와 fullscreen 아트 요청은 없고 정상 페이지·자산 HTTP 오류는 0건이었다.
- 초기 전송량: 새 브라우저 세션의 기본 캐시 설정에서 첫 SDK fixture Gameplay Start까지 CDP로 관측한 로컬 전송량은 PC·터치 모두 **약 17.81MB**였다. 등록된 배포 파일 합계보다 큰 것은 HTML·Phaser의 요청과 전송 헤더를 포함하기 때문이다. 외부 공식 SDK의 실제 전송량·CrazyGames CDN 압축/캐시·포털 집계는 이 수치에 포함해 입증하지 않는다. 이벤트 시점을 앞당기지 않았다.
- 재생성: 동일 설정 재실행은 해시 기반 캐시를 사용했다. SHOP maxEdge만 256→320으로 바꾸면 파일 63,742→90,416 bytes와 실제 DOM naturalWidth 320이 관측됐다. 설정만 변경하는 관측 중 첫 임시 스크립트는 HMR 시점의 DOM 준비 확인을 보완해 다시 실행했다. 최종 256으로 복원·재생성했다.
- 산출물: `test-results/optimized-assets/`의 원본/최적화 장면 PNG, `game-observations.json`, `standalone-observations.json`, `production-network.json`, `content-edit.json`. 정식 회귀 스위트를 추가하거나 실행하지 않았으며 기존 E2E의 콤보 확장자·누락 자산 URL 두 기대값만 맞췄다.
- 제한/다음: 실제 포털의 재업로드 Load size·모바일 홈페이지 자격, 공식 SDK·실기기·Safari/Firefox·느린 회선은 미확인이다. 최신 `dist/`를 새 빌드로 업로드하고 포털 수치를 확인해야 한다. 기존 생성 원본 PNG는 업로드하지 않는다.

## 2026-10-13 — SHOP·소리·전체화면 아이콘 생성·적용

- 제작: 기존 파란 패널·금화 아이콘을 참조해 상점, 소리 ON/OFF, 전체화면 진입/해제 PNG 5종을 생성했다. 실제 출력은 모두 1254×1254 RGBA·알파 0~255이며 원본 그대로 복사했다. 해시·프롬프트·참조 연결은 [제작 기록](art/utility-icons.md)과 [메타데이터](art/utility-icons-metadata.json)를 따른다.
- 적용: 필수 이미지 로더와 Shell의 네이티브 버튼에 연결했다. SHOP만 작은 글자를 남기고 소리·전체화면은 상태 이미지·title·aria-label로 표시한다. 판 없이 그림자·눌림 반응을 사용하며 클릭 영역은 최소 44×44px, 이미지 표시는 32~72px다. 스킨 목록·구매·저장·게임 규칙은 기존 구현을 사용한다.
- 개발 Chromium PC 1280×900·Pixel 7 터치 에뮬레이션: SHOP 클릭/Enter·닫기/Escape·복귀 포커스, 소리 클릭/Space·새로고침 후 OFF 복원, 실제 전체화면 진입/해제와 이미지·설명 전환을 관측했다. 설정 조작은 메뉴 시작·낙하를 유발하지 않았다. 별도 시작 후 첫 낙하는 적층 1개가 됐다. 정상 경로의 페이지·자산 HTTP 오류는 0건이었다.
- 진행 배경: 실제 입력과 개발 시간 제어로 각 환경에서 20개까지 쌓고 5·10·15·20개의 점심·저녁·밤·아침 위 ON/OFF를 캡처했다. 소리 버튼 뒤 게임 영역에 포커스를 되돌리고 착지/정착 단계를 나눠 시간을 진행했다. 점수·동전 좌표를 덮어쓰지 않았다. 플레이 중 실제 전체화면 진입/해제도 점수 20을 유지했다.
- 작은 화면·실패: 360×640·821×462에서도 클릭 영역은 최소 44px다. 작은 가로 화면의 SHOP 글자는 최소 10px로 보완했다. 저장 오류 문구가 시작 글자와 겹치는 초기 배치를 발견해 하단 중앙으로 이동했다. 필수 sound-off 이미지의 의도적 404는 기존 로딩 오류·PLAY/SHOP 비활성화를 표시했다.
- CrazyGames SDK fixture production preview PC·터치: 플랫폼 음소거는 OFF·비활성화·설명으로 표시하고 플랫폼 해제 시 사용자 설정을 복원했다. 사용자 OFF를 설정한 뒤 플랫폼 ON/OFF·새로고침을 거쳐도 설정 원문과 OFF를 유지했다. SHOP 진입, 실제 시간 입력으로 1개 완료/+1 지급·TRY AGAIN, init/start/stop, 자체 전체화면 숨김·개발 훅 제외를 관측했다. 정상 페이지·자산 HTTP 오류는 0건이었다.
- 정적 검사·빌드: `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build:crazygames`(TypeScript 포함)를 통과했다. 현재 CrazyGames `dist/`에 새 아이콘과 상태 전환을 포함한다.
- 산출물: `test-results/utility-icons/`의 메뉴·SHOP·플레이·일시정지·전체화면·시간대·배포 PNG와 `observations.json`, `background-observations.json`, `production-observations.json`, `notice-observations.json`이다. 초기 시간 진행/포커스 관측의 불완전한 5/10/15/20 이름 대신, 수정 후 실제 점수 5/10/15/20인 기록을 사용한다.
- 제한: 회귀 테스트 스위트·실제 포털/공식 SDK·실기기·Safari/Firefox·스크린리더·사람의 인식 속도는 확인하지 않았다. 소리 테스트의 기존 문자열 기대값 4개만 접근성 이름으로 맞췄으며 테스트를 추가하거나 실행하지 않았다. PNG 합계 약 4.89MiB·원시 RGBA 약 30MiB에 캐시 비용이 추가되며 최저 사양 로딩·메모리 성능은 미확인이다.

## 2026-10-13 — SKINS·구매·자동 장착·브라우저 저장

- 구현: `game/skins.ts`에 금화/은화/루비/에메랄드와 초기 가격·이미지·텍스처 키를 분리했다. 메뉴의 SKINS에서 4개 미리보기·잔액·가격·보유/장착 상태를 표시하고 구매 확인·취소·부족량·무료 교체를 제공한다. Scene은 같은 art frame과 기존 표시 크기로 메뉴·이동·적층 동전을 그린다.
- 저장: v4의 `ownedSkins`·`equippedSkin`을 기존 기록·별조각과 함께 보존한다. `Store.commit`은 저장 성공 후에만 후보를 반영하므로 구매 실패 시 잔액·보유·장착이 유지된다. v1/v2/v3 fixture를 실제 브라우저에 넣고 pagehide flush를 호출해 기록/잔액 보존과 금화 보유·장착, v4 저장을 관측했다. 저장 쓰기 실패·손상/미래 버전·미보유 스킨 장착 데이터에서는 원본을 보호한다.
- PC 1280×900·Pixel 7 에뮬레이션: 잔액 0의 부족량·비활성화, 500 fixture에서 은화/루비/에메랄드 순서로 450/300/0 잔액, 확인 취소, 자동 장착, 금화/보유 스킨 무료 교체, 새로고침·중단 판 이후 보존을 관측했다. 실제 플레이 획득량으로 500을 모은 결과가 아니며 가격 속도의 근거로 삼지 않는다.
- 입력/화면: SKINS에서 Space가 새 판을 시작하지 않고, Tab/Shift+Tab이 활성 대화상자 안에서 순환하며 Escape가 구매 확인 취소/화면 닫기로 동작했다. 시작·복귀 포커스도 관측했다. 360×640·821×462의 목록 배치, 기본 PC/터치 화면의 구매 확인, 실제 장착된 세 스킨의 20개·X19 플레이를 캡처했다. 진행 좌표·점수는 덮어쓰지 않았다. 실제 스크린리더 조작은 미확인이다.
- 실패: quota를 구매 확정/무료 교체 시 발생시켜 구매 전 잔액·보유·장착과 원본 보존, 실패 안내·후속 구매 비활성화·BACK 포커스를 관측했다. 이후 실제 한 판을 종료하면 임시 잔액만 500→501로 증가하고 원본과 기존 보유·장착은 유지됐다. 필수 루비 이미지 404에서는 로딩 오류와 PLAY/SKINS 비활성화를 관측했다. 임시 저장 실패 후 플레이는 허용하며 후보 구매를 뒤늦게 저장하지 않는다.
- 콘텐츠 편집: 은화 가격만 일시적으로 50→55로 바꾸면 BUY·확인창·실제 차감이 함께 바뀌고 잔액 75→20이 되는 것을 관측했다. 이후 확정 가격 50으로 되돌렸다. 조정 위치는 `src/game/skins.ts`다.
- 정적 검사·빌드: `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build:crazygames`(TypeScript 포함)를 통과했다. 기존 단위/E2E 기대값과 구버전 fixture는 v4 호환을 위해 갱신했으나 테스트 스위트를 추가하거나 실행하지 않았다.
- CrazyGames SDK fixture production preview의 PC·터치: 잔액 75에서 은화 구매 후 25, 실제 시간 입력으로 1개 적층 뒤 실패하여 +1/26, TRY AGAIN·중단·메뉴/새로고침 뒤 은화 보유·장착/잔액 26 복원을 관측했다. 기존 두 기록은 53/X8로 유지됐다. 모든 미리보기 이미지 디코딩, init/start/stop, 자체 전체화면 숨김·개발 훅 제외도 유지됐다. 관측한 정상 개발/배포 경로의 페이지·HTTP 오류는 0건이며 의도적인 누락 이미지 404는 별도 실패 사례다.
- 산출물: `test-results/skin-purchases/`의 PNG·`observations.json`·`supplement-observations.json`·`production-observations.json`·콘텐츠 편집/실패 후 플레이 기록. 현재 CrazyGames dist에 실제 스킨 기능을 포함한다. 새로 로드하는 세 PNG 약 2.15MiB·원시 RGBA 약 18.0MiB이며 추가 캐시 비용은 별도다.
- 제한: 정식 회귀 스위트 통과·실제 포털/공식 SDK·물리 기기·Safari/Firefox·최저 사양 성능을 입증하지 않는다. 실제 첫 구매 판 수와 수집 동기는 사람의 PC 플레이가 필요하다. 광고·클라우드 동기화는 구현하지 않았다.

## 2026-10-13 — 동전 스킨 3종 제작·장면 관측

- 원본 `coin.png`를 참조해 은화·루비·에메랄드를 내장 image_gen으로 각각 한 번 생성했다. 모두 원본과 같은 1599×984 RGBA·알파 0~255이며 생성 원본을 그대로 복사했다. 기존 금화 SHA-256은 유지된다. 세 장 합계 약 2.15MiB, 원시 RGBA 약 18.0MiB이며 추가 캐시 비용은 별도다.
- 알파 >8 실루엣이 모두 기존 art frame `(300,180,1000,630)` 안에 들어온다. 원본과의 마스크 교집합/합집합은 은화 99.68%·루비 98.66%·에메랄드 99.22%이며 외곽 픽셀은 완전히 동일하지 않다. 자세한 경계·해시·프롬프트는 [제작 기록](art/coin-skins.md)을 따른다.
- 실제 Chromium PC 1280×900·Pixel 7 에뮬레이션에서 이미지 응답만 임시 대체해 원본과 세 스킨을 비교했다. 기존 Phaser frame·166×102 동전 표시·188×115 메뉴 표시를 사용했다. 마우스·터치와 개발 시간 제어로 메뉴·NICE·Perfect/X1·5/10/15/20개를 관측했다. 점수·좌표를 덮어쓰지 않았으며 각 실행은 20개·최장 X19 이후 중심을 벗어난 낙하로 종료됐다.
- 아침/점심/저녁/밤에서 왕관·테두리·옆면과 금속/보석 재질이 보이며 잘림·불투명 배경·외곽 장식은 관측되지 않았다. 8개 실행의 페이지·자산 HTTP 오류는 0건이었다. 산출물은 `test-results/coin-skins/`의 PNG·`observations.json`이다.
- `rtk npm run build:crazygames`(TypeScript 포함)를 통과했다. dist는 새 파일을 포함하지만 기본 로더·게임은 기존 금화를 사용한다. 구매·장착·스킨 저장 기능은 이번 범위에서 구현하거나 검증하지 않았다. 테스트 스위트를 추가하거나 실행하지 않았다.
- 제한: 실제 기기·Safari/Firefox·사람의 외형 선호/가독성·최저 사양 메모리/로딩 성능은 미확인이다. 임시 이미지 응답 관측은 완성된 스킨 선택 기능의 검증과 구분한다.

## 2026-10-12 — TAP TO PLAY 표시 50% 축소

- 사용자 요청에 따라 CSS 이미지 폭을 102.74%→51.37%, 가로 위치를 -1.51%→24.245%로 조정했다. 가로·세로 표시가 각각 절반이며 글자 중심과 기존 입력 영역은 유지된다. 원본 PNG는 그대로다.
- `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build:crazygames`(TypeScript 포함)를 통과했다. 현재 `dist/`에 축소 표시를 반영했다. 테스트 스위트를 추가하거나 실행하지 않았다.
- Chromium PC 1280×900·Pixel 7 에뮬레이션·360×640·821×462에서 메뉴 화면을 관측했다. 이전 관측과 입력 영역이 동일하고 이미지 폭은 기존의 0.5배다. 이미지 클릭/터치·Space·포커스된 Enter로 시작 시 score 0, 별도 낙하 후 score 1을 관측했다. 메뉴 복귀와 SOUND 조작도 유지되며 페이지/자산 HTTP 오류는 0건이다.
- 산출물: `test-results/main-screen-half/`의 PNG·`observations.json`. 실제 모바일 기기·Safari/Firefox·축소 문구의 사람 가독성은 미확인이다.

## 2026-10-12 — 메인 화면 정리·TAP TO PLAY 이미지

- 범위: 메인 화면 BEST ON THIS BROWSER 제목·PLAY 아래 조작 설명을 제거했다. 파란 PLAY 판은 없애고 생성한 TAP TO PLAY 이미지 글자를 표시한다. 두 개인 최고·별조각·설정·결과 버튼·인게임 입력은 유지한다.
- 자산: 내장 image_gen으로 기존 logo/Perfect를 참조해 한 번 생성한 투명 PNG를 그대로 복사했다. 실제 2172×724 RGBA·812,872 bytes, 알파 0~255. CSS 표시 영역에서 투명 여백만 제외했고 원본 픽셀은 편집하지 않았다. 철자·흰 얼굴/파란 베벨·투명 배경을 게임 화면에서 관측했다. 전체 프롬프트·출처·해시는 [제작 기록](art/tap-to-play.md)에 있다.
- 접근성/입력: 판 없는 네이티브 버튼의 이름은 Tap to play다. Chromium PC 마우스·Pixel 7 터치의 이미지 선택, 캔버스 선택, 문서 Space, 포커스된 이미지 Enter로 시작한 후 250ms 진행해 moving/score 0을 관측했다. 별도 마우스/터치 또는 Space 입력으로 첫 동전을 쌓아 score 1이 됐다. 이미지 시작 뒤 포커스는 game으로 이동했다. 메뉴의 SOUND 조작은 시작하지 않았고 중단 확인 후 메뉴로 복귀해 같은 시작 화면을 표시했다.
- 화면 범위: PC 1280×900·Pixel 7·360×640·821×462. 제목·하단 설명 노드는 없고 시작 영역 computed background none/투명·border 0px다. 시작 이미지·받침대·하단 설정의 비겹침을 화면으로 관측했다. 작은 가로 화면에서 시작 영역/설정 버튼 사이 약 15.83px 간격이었다.
- 정적 검사·빌드: `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build:crazygames`(TypeScript 포함)를 실행했다. 기존 SDK 검사 한 곳의 PLAY 문자 기대값을 새 접근성 이름으로 맞췄으나 테스트 스위트를 추가하거나 실행하지 않았다.
- CrazyGames 배포 preview: SDK fixture·실제 시간·마우스/터치로 이미지 시작→별도 낙하→실패 결과→메뉴/새로고침을 관측했다. 새 PNG 디코딩, +1/잔액 1 복원, init/start/stop, 자체 전체화면 숨김·개발 훅 제외를 확인했다. 실제 포털/공식 SDK 검증은 아니다.
- 개발·배포 PC/터치의 페이지/자산 HTTP 오류 0건. 산출물: `test-results/main-screen/`의 PNG·`observations.json`·`production-observations.json`. 현재 CrazyGames dist는 새 시작 화면과 PNG를 포함한다.
- 제한: 실제 기기·Safari/Firefox·스크린리더 조작·처음 보는 사람의 시작 발견 속도·최저 사양 로딩 비용은 미확인이다. 이미지의 원본 RGBA 약 6.0MiB와 브라우저/Phaser 캐시 비용은 별도다.

## 2026-10-12 — 버튼형 박스를 제거한 아이콘·숫자 표시

- 사용자 채택: 버튼 안에 아이콘이 어색하다는 피드백에 따라 `game-workshop`으로 [표시 원칙](ART_DIRECTION.md#기록재화의-화면-표시-원칙)을 확정한 뒤 구현했다. 메뉴·결과·HUD에서 기록·별조각·현재 COINS의 박스/테두리/채움을 제거했다. 비교 열·항목별 NEW BEST·EARNED/TOTAL·실제 조작 버튼은 유지했다.
- 구현: Shell의 표시 클래스와 CSS만 변경했다. 기록은 금색, 별조각은 밝은 청록색 숫자에 짙은 외곽선·짧은 그림자를 주며 아이콘을 조금 키우고 숫자 간격을 줄였다. 메뉴의 별조각이 장식 동전에 겹쳐 보여 패널용 패딩을 없애고 기록·잔액을 위쪽으로 정렬했다. 이미지 원본·게임/저장 규칙·공통 서비스는 바꾸지 않았다.
- 정적 검사·배포 빌드: `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build:crazygames`(TypeScript 포함)를 실행했다. 이번 작업에서 테스트 스위트를 추가하거나 실행하지 않았다.
- 개발 관측: Chromium PC Space·Pixel 7 터치 입력과 개발 시간 제어로 21개·최장 x20을 만들었다. 1/6/11/16/21개에서 실제 Scene 배경 morning/noon/evening/night/morning과 HUD를 캡처했다. 위치·점수는 덮어쓰지 않았다. 정지/재개 뒤 종료 시 두 NEW BEST·+21/21, TRY AGAIN에서 초기화, 후속 1개 완료 뒤 메뉴 잔액 22를 관측했다.
- 화면: PC 1280×900·Pixel 7·360×640·821×462에서 메뉴·HUD·결과, x0/x20/x100, 잔액 9,999,999→10,000,000과 안전 정수 최댓값 fixture를 관측했다. 표시 영역 computed style은 배경 none/투명·border 0px였다. 관측한 아이콘/숫자 쌍의 겹침과 할당 영역 이탈, 이미지 디코딩 실패는 없었다. 두 NEW BEST가 있는 Pixel 7 결과의 기록/격려 문구 간격 약 15.17px, 작은 가로 결과의 보상/버튼 간격 약 6.09px다. 긴 극단값은 축소 표시이며 사람의 가독성을 입증하지 않는다.
- 배포 관측: CrazyGames SDK fixture와 실제 시간·Space/터치로 로컬 production preview의 메뉴·플레이·결과·메뉴·새로고침을 관측했다. 아이콘 3종 로드, +1 지급·잔액 1 복원, SDK init/start/stop·자체 전체화면 숨김·개발 훅 제외를 확인했다. 실제 포털/공식 SDK 검증은 아니다.
- 개발·배포 PC/터치의 페이지·자산 HTTP 오류 0건. 현재 CrazyGames `dist/`는 박스 없는 아이콘 표시를 포함한다. 산출물은 `test-results/icon-readouts/`의 PNG·`observations.json`·`production-observations.json`이며 임시 관측 스크립트를 사용했다.
- 제한: 실제 기기·Safari/Firefox·스크린리더·사람의 정보 인식/편안함·최저 사양 성능은 미확인이다. 별도 단위/E2E 회귀 통과를 주장하지 않는다.

## 2026-10-12 — 메뉴·결과·인게임 아이콘 적용

- 변경: 생성한 아이콘 3종을 필수 로더·Shell에 연결했다. 메뉴는 두 개인 최고와 별조각 잔액, 결과는 기록별 아이콘과 THIS RUN/BEST·NEW BEST 및 별조각 EARNED/TOTAL, HUD는 저장된 두 개인 최고·잔액과 별도 COINS를 표시한다. PNG 픽셀·저장 schema·보상 규칙은 바꾸지 않았다.
- 정적 검사·빌드: `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build:crazygames`(TypeScript 포함)를 실행했다. 단위/E2E/SDK 테스트 스위트를 추가하거나 실행하지 않았다.
- 개발 화면 관측: 로컬 Chromium PC Space·Pixel 7 터치 API와 개발 시간 제어로 실제 11개·최장 x10을 만들었다. 동전 위치나 점수를 덮어쓰지 않았다. 진행 중 개인 최고 0/x0·잔액 0, 정지·재개 뒤 실패 시 결과 11/x10와 두 NEW BEST·+11/11, 메뉴 11/x10·잔액 11을 관측했다.
- 배치 조정: 첫 상단 가로줄 배치가 좌측 작은 로고를 가려 오른쪽 53%의 두 줄로 수정했다. 별조각 아이콘과 숫자가 패널 양끝으로 벌어진 것도 중앙 정렬로 수정했다. 원본의 투명 여백을 CSS 표시 영역으로 제외하고 메뉴 10cqw·결과 8cqw·HUD 5.5cqw 등으로 맞췄다.
- 화면 범위: desktop 1280×900·Pixel 7·360×640·821×462. x0/x10/x100, 잔액 9,999,999→10,000,000, 안전 정수 최댓값 저장 fixture를 표시했다. 관측한 아이콘/숫자 쌍의 겹침·패널 이탈과 이미지 로딩 실패는 없었다. 작은 가로 결과의 보상/버튼 간격은 약 4.09px, 두 NEW BEST가 있는 모바일 결과의 비교 패널/격려 문구 간격은 약 5.92px다. 극단적으로 긴 값은 크게 축소되므로 읽기 쉬움을 보장하지 않는다.
- 배포 관측: CrazyGames production preview에서 SDK fixture와 실제 시간·Space/터치를 사용했다. 메뉴·플레이·결과·새로고침에서 모든 아이콘 디코딩, +1 지급·잔액 1 복원, init/start/stop, 자체 전체화면 숨김과 개발 훅 제외를 관측했다. 공식 SDK·실제 포털 검증은 아니다.
- 개발·배포의 PC/터치 관측에서 페이지/자산 HTTP 오류 0건. 산출물은 `test-results/icon-integration/`의 PNG·`observations.json`·`production-observations.json`이다. 관측 스크립트는 임시 파일이며 테스트 스위트에 추가하지 않았다. 현재 CrazyGames `dist/`는 아이콘을 포함한다.
- 제한: 실기기·Safari/Firefox·사람의 항목 이해와 읽기 속도·최저 사양 성능은 미확인이다. 원본 아이콘 합계 약 2.34MiB와 디코드 RGBA 약 18MiB를 유지하며 브라우저/Phaser 캐시 비용은 별도다. 접근성 이름과 표 구조는 유지했으나 실제 스크린리더로 조작하지 않았다.

## 2026-10-12 — 기록·별조각 아이콘 이미지 제작

- 요청 범위: BEST COIN, BEST COMBO, STAR SHARDS 이미지부터 제작. 기존 금화·Perfect를 참조해 서로 다른 형태의 투명 PNG 3종을 `public/assets/coin-tower/icons/`에 저장했다. 실제 출력은 각 1254×1254 RGBA다.
- 파일 관측: PNG 크기·알파 0~255·파일 해시를 읽었다. 생성 원본과 같은 파일이며 픽셀 후처리 없음. 배경의 투명 픽셀과 내부 대부분 알파 253을 유지했다.
- 화면 관측: Chromium에서 기존 파란 패널·청록색 패널 위에 48/64/96px로 표시하고 체크무늬 위 160px도 비교했다. 금화 탑의 층·왕관, 금빛 섬광의 연결, 청록색 결정의 큰 실루엣은 구분된다. 세부 요소와 아이콘별 광학적 크기는 실제 UI 적용 때 다시 관찰한다.
- 산출물: [자산 비교 페이지](art/ui-icons-preview.html), `test-results/ui-icons/preview.png`, `metadata.json`. 프롬프트·출처·크기 예산은 [제작 기록](art/ui-icons.md)에 있다.
- 게임 코드·런타임 manifest·기존 이미지·배포 빌드는 변경하지 않았으며 테스트 스위트는 실행하지 않았다. 이번 관측은 자산 미리보기이고 게임 내 적용·가독성 검증은 후속이다.

## 2026-10-12 — 별조각 수집·표시·브라우저 저장

- 범위: `STAR SHARDS` 결과 EARNED/TOTAL·메뉴 보유량, 성공 동전당 기본 보상, 첫 실패 시 한 번 정산, 중단 제외, 기존 기록과 함께 저장 형식 v3로 보존. 구버전 fixture는 `tests/fixtures/progress-migrations.json`에 있다. 스킨·상점·광고 연동은 추가하지 않았다.
- 정적 검사와 빌드: lint·TypeScript·format 검사와 `build:crazygames`를 실행했다. 이번 작업에서는 단위/E2E/SDK 테스트 스위트를 추가하거나 실행하지 않았다. 기존 검사 코드의 저장 데이터 fixture·기대값은 새 형식과 맞췄으나 통과했다고 보고하지 않는다.
- 개발 관측: Chromium PC의 실제 Space 입력과 Pixel 7 터치 에뮬레이션에서 개발 시간 제어로 NICE와 Perfect를 섞어 9개를 쌓았다. 점수나 동전 좌표는 덮어쓰지 않았다. 종료 전·정지·재개 카운트다운에서는 잔액 75, 첫 실패 후에는 획득 +9·잔액 84, 후속 1개 완료 판에서는 85였다. 추가 시간 진행·메뉴·새로고침은 중복 지급하지 않았다.
- 중단·이행: 진행 중 RESTART·MENU·새로고침 뒤 기존 잔액 84를 유지했다. v1의 높이·완료 횟수와 v2의 높이·콤보·완료 횟수를 보존하고 별조각 0으로 이행했으며 v3의 75도 복원했다. fixture 주입 전 이전 페이지의 dirty 저장을 먼저 flush해 주입 데이터가 pagehide에 덮어써지지 않도록 관측 절차를 수정했다.
- 실패 처리: quota 오류에서는 75→76→77이 메모리에서만 증가하고 실제 저장은 75였다. 임시 상태를 안내하고 재시도 플레이를 허용했다. 새로고침 후 75로 복원했다. 잘못된 JSON·잘못된 v2·미래 버전 원본은 완료 판 뒤에도 덮어쓰지 않았다.
- 화면: PC·Pixel 7·360×640·821×462에서 메뉴와 결과를 캡처했다. 최초 작은 가로 화면의 보상/버튼 겹침 약 3px를 발견해 문구·보상 패널을 위로 옮겼다. 자릿수 변화 9,999,999→10,000,000도 관찰했다. 이는 사람의 읽기 속도 검증이 아니다.
- 배포 관측: CrazyGames production preview에서 SDK 초기화 fixture와 실제 Space·터치로 완료 판·메뉴·새로고침을 관찰했다. 구버전 기록을 유지한 채 +1 지급·잔액 1 복원, gameplay init/start/stop, 자체 전체화면 숨김과 개발 훅 제외를 관측했다. 이는 공식 SDK·포털 검증이 아니다.
- 개발·배포 관측에서 페이지/자산 오류 0건. 산출물: `test-results/shard-collection/`의 화면과 `observations.json`, `production-observations.json`. 실행에 사용한 임시 관측 스크립트는 저장소의 테스트 스위트에 추가하지 않았다.
- 제한: 실제 기기·포털·브라우저 간 동기화·여러 탭 병합·사람의 수집 동기는 확인하지 않았다. 저장은 기존 origin별·브라우저별 범위이며 여러 탭은 마지막 쓰기가 이긴다. 현재 CrazyGames `dist/`는 수집 기능을 포함한다.

## 2026-10-11 — NICE/Perfect 시각 구분 조정

- 사용자 피드백: 효과음 차이는 느껴지지만 이미지상 비슷하며 반동은 유지하고 싶다는 보고. [사용자 관측과 평가](PLAYTEST_NOTES.md)를 따른다.
- 변경: NICE의 링을 제거하고 작은 따뜻한 금색 원형 입자 4개·160ms로 줄였다. Perfect는 흰빛·금색 네 갈래 별 8개와 두 겹 접점 링을 260ms 표시한다. 반동·Perfect/X 팝·효과음·판정·게임 시간·저장은 수정하지 않았다. 새 아트 파일·의존성은 추가하지 않았다.
- 런타임 관측: Chromium PC Space·Pixel 7 터치 에뮬레이션으로 21개까지 실제 입력, 개발 시간 제어로 42·54·90·180·280ms와 5·10·20개 화면을 관찰했다. 같은 90ms의 NICE/Perfect, 360×640, 동작 줄이기, 정지·카운트다운·계속하기·RESTART·HOME·사용자 음소거를 캡처했다. 점수·동전 좌표를 덮어쓰지 않았다.
- 결과: 일반/Perfect의 입자 형태와 링 유무가 화면에서 구분된다. 반동의 최대 높이 95.88/93.84 논리 px와 팝 1.08, 280ms 뒤 다음 동전은 유지됐다. 정지 시 잔여 시간과 표시 크기를 보존하고 문구·입자를 숨기며, 재시작·HOME에서 초기화한다. 4개 관측 환경(PC·터치·동작 줄이기·빠른 Escape 정지)의 page/자산 HTTP 오류는 0개다. 사람의 구분 속도·쾌감 검증은 아니다.
- 정적 확인: `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build:crazygames` 성공. 현재 `dist/`는 조정된 CrazyGames 빌드이며 production JS에 개발 관측 훅이 없음을 확인했다. 첫 빌드에서 `Graphics.fillPoints`에 전달한 일반 좌표 객체가 Phaser 4의 Vector2 타입과 맞지 않아 실패했다. 재사용 Vector2 꼭짓점으로 보완한 뒤 TypeScript·CrazyGames 빌드는 통과했다.
- 산출물: `test-results/feedback-differentiation/`의 비교 PNG와 `observations.json`. 관측용 임시 스크립트를 실행했으며 단위/E2E/SDK 회귀 스위트는 추가하거나 실행하지 않았다. 이전 자동 검사 통과를 이번 조정의 결과로 간주하지 않는다.
- 미검증: 실제 Android/iPhone·Safari/Firefox, 실제 CrazyGames Preview와 사용자 무음 비교 플레이. 효과가 더 쉽게 구분되는지와 주의 분산은 사용자의 재확인이 필요하다.

## 2026-10-11 — 착지 손맛과 Perfect 차별화 구현

- 변경: 새 동전의 짧은 눌림·복원, 접점 빛·입자, Perfect/X의 8% 팝, 일반/Perfect의 기존 WAV 재생 속도 차이. 연출 시간은 Session의 기존 피드백 잔여 시간에서 계산하고 판정·좌표·속도·정착 시간·저장은 수정하지 않았다. 소리 서비스가 일회성 효과음을 소유해 중단 시 정리한다.
- 브라우저 관측: macOS / Node 24.16.0 / Playwright 1.63.0 Chromium. PC Space·Pixel 7 실제 브라우저 터치·동작 줄이기 환경에서 개발 시간 제어로 성공·중단·재개·초기화를 진행했다. Scene 실제 표시 크기·입자 가시성과 HTML transform, Web Audio node 값을 읽고 PNG를 캡처했다. 점수나 동전 위치를 덮어쓰지 않았다. 회귀 스위트 실행과는 구분한다.
- 확인한 흐름: 첫 동전 NICE/콤보 0, 치우친 NICE, Perfect/X1, 반동 복원과 기존 280ms 뒤 다음 동전, 효과 도중 정지·카운트다운·계속하기, RESTART·HOME, 사용자 음소거, 동작 줄이기. 구체적 측정과 체감 가설은 [플레이 관측](PLAYTEST_NOTES.md)을 따른다.
- 오디오: 일반 0.88/Perfect 1.24의 실제 Web Audio 재생 속도, 상대 효과음 gain, 음소거 시 master mute gain 0을 관측했다. 착지 직후 Escape로 정지한 추가 관측에서 source 시작 1회·stop 1회를 확인했고 카운트다운·재개 후에도 각각 1회로 유지됐다. 처음에는 `start()` 호출 순간의 AudioParam 기본값을 읽어 1로 보였으며, 오디오 갱신 뒤 실제 node 값을 읽도록 관측 코드를 보완했다. 음색을 직접 청취한 검증은 아니다.
- PC·모바일에서 실제 입력으로 103개까지 진행해 5·10·20개와 X10·X100의 최대 팝을 관측했다. PC·모바일 X100은 두 줄 영역 안에 표시되고 360×640의 X1도 잘리지 않는다. 마지막 관측의 page 오류·자산 HTTP 오류는 각 환경에서 0개다. 관측 산출물은 ignore된 `test-results/feedback-observation/`의 PNG·`observations.json`이다. 관측용 Node 스크립트는 임시 파일로 실행했으며 새 테스트 파일은 추가하지 않았다.
- `rtk npm run lint`, `rtk npm run format:check`, `rtk npm run build:crazygames`: 린트·전체 포맷·TypeScript·CrazyGames 배포 빌드 성공. production JS에서 개발 관측 훅 제외를 확인했다. 현재 `dist/`는 새 연출을 포함한 CrazyGames 빌드다. 이번 연출 변경에서 단위/E2E/SDK 회귀 스위트는 추가하거나 재실행하지 않았다. 아래 67개 단위·이전 브라우저 검사 통과는 연출 변경 전 체크포인트의 결과다.
- 미검증: 실제 Android/iPhone·Safari/Firefox, 실제 소리 청취·사람의 쾌감·반복 피로·주의 분산, 실제 CrazyGames 플랫폼 mute/포털 Preview. 현재 임시 음원은 전용 금속음 자산으로 교체한 것이 아니다.

## 2026-10-11 — 일반 성공 범위 확대와 Perfect 유지

- 변경: 일반 성공 허용 중심 거리를 동전 폭의 45%로 넓혔다. Perfect 10%·이동 속도·첫 실패 종료·저장 방식은 유지한다. 기존 배경 검사의 실패 준비 위치는 새 허용 범위 밖으로 옮겼다.
- `rtk npm run check`: 린트·포맷·단위 검사 6개 파일 67개·타입·standalone 배포 빌드 성공. 양쪽 성공/Perfect 경계와 경계 바로 밖을 고정 수치로 확인하는 단위 검사를 추가했다.
- 전체 개발 브라우저 검사: Chromium PC·Pixel 7 터치 에뮬레이션의 30개 중 29개 통과, PC 집중 착지 검사 1개 중단. 검사 중 소스 주석을 수정해 Vite가 페이지를 재로딩했고 개발 관측 훅이 사라졌다. trace의 중복 문서 요청·Vite 연결과 초기 메뉴 복귀를 확인했다. 모바일 착지 검사와 기존 입력·콤보·기록·중단·배경 검사는 통과했다.
- `rtk proxy env PLAYWRIGHT_HTML_OPEN=never npm run test:e2e -- landing.spec.ts --reporter=line`: 소스 수정 없이 PC·모바일 집중 착지 재검사 **2개 통과**. 양쪽 35%·45% 치우침의 NICE, 45.01% 실패, 10% Perfect, 10.01% NICE를 실제 마우스·Space·터치로 확인했다. 수집한 page 오류는 없다. 개발 시간 제어를 사용하며 점수·좌표를 덮어쓰지 않는다. production에서는 정밀 경계용 개발 훅이 없어 제외한다.
- `rtk npm run build:crazygames`: TypeScript·CrazyGames 배포 빌드 성공. production JS에 개발 훅이 없음을 확인했다. 마지막 `dist/`는 확대된 허용 범위의 CrazyGames 빌드다.
- `rtk proxy env E2E_PREVIEW=1 CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js PLAYWRIGHT_HTML_OPEN=never npm run test:crazygames -- --reporter=line`: 배포 회귀 **16개 통과**(fixture 14개·공식 SDK local 2개). SDK 파일 해시는 `DEPENDENCIES.md`와 일치한다. 실제 포털 Preview나 production의 정밀 착지 경계 검사와는 구분한다.
- 산출물: `test-results/standalone/landing-*/landing-*.png`. PC 양쪽 성공 경계와 모바일 Perfect/X1 캡처를 직접 확인했다. 재실행하면 교체된다. 화면 관측과 체감의 한계는 [플레이 관측](PLAYTEST_NOTES.md)을 따른다. 실제 Android/iPhone·Safari/Firefox와 사람의 공정성·쾌감은 미검증이며 실기기 조정은 보류한다.

## 2026-10-09 — 시간대 전환 브라우저 검증

- 대상: 배경 전환 구현 `fff8181`에 개발 전용 렌더 조회와 반복 E2E를 추가한 작업본. 런타임의 게임 규칙·페이드 시간·아트는 수정하지 않았다.
- 환경: macOS / Node 24.16.0 / Playwright 1.63.0 Chromium, Desktop Chrome과 Pixel 7 터치 에뮬레이션. 개발 시간 제어와 실제 마우스·Space·터치로 도달했으며 점수·좌표를 덮어쓰지 않았다.
- `rtk proxy env PLAYWRIGHT_HTML_OPEN=never npm run test:e2e -- backgrounds.spec.ts --reporter=line`: PC·모바일 2개 시나리오씩 **4개 통과**. 5·10·15·20·25개 경계와 경계 전 유지, 0·300·600·900·1200ms의 실제 Scene texture·alpha·표시 크기, 자동 RAF 전환 완료를 확인했다.
- 중단·종료: 페이드 중 정지, 카운트다운 동안 보존, 합성 blur/focus 재중단, 계속하기, 재시작 확인 취소·승인, HOME, 실패 중간 상태 유지와 TRY AGAIN의 초기화를 확인했다. 실제 OS 탭 전환은 아니다.
- 런타임 관측: 집중 검사에서 처리되지 않은 page 오류와 자산 HTTP 오류 없음. PC·모바일 중간/완료·Perfect 캡처를 직접 확인했다. 검은 빈 구간이나 큰 위치 어긋남은 확인한 화면에 보이지 않는다. 구체적 화면 관찰과 가독성 가설은 [플레이 관측](PLAYTEST_NOTES.md)에 구분했다.
- 초기 실패와 보완: sandbox의 로컬 서버 포트 차단 뒤 허용된 실행으로 진행했다. 최초 4개 검사는 검사 준비 오류로 실패했다. 페이드 대기 후의 이동 반전을 포함해 목표까지 시간을 계산하고, 자동 RAF의 모델·렌더 값을 한 호출에서 읽도록 수정한 뒤 4개 모두 통과했다. 배경 게임 코드 결함 수정은 없었다.
- `rtk npm run check`: 린트·전체 포맷·단위 검사 6개 파일 65개·타입·standalone 배포 빌드 성공. 이후 `rtk npm run build:crazygames`도 성공했다. production JS에 개발 훅이 없음을 확인했다. 마지막 `dist/`는 CrazyGames 빌드다.
- `rtk proxy env E2E_PREVIEW=1 CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js PLAYWRIGHT_HTML_OPEN=never npm run test:crazygames -- --reporter=line`: CrazyGames 배포 회귀 **16개 통과**(fixture 14개·공식 SDK local 2개). 자산 로딩·초기화·플레이 이벤트·음소거·영어 UI·자체 전체화면 숨김·작은 화면을 확인했다. 공식 SDK 임시 파일 해시는 기존 `DEPENDENCIES.md`와 일치한다. 실제 포털 Preview나 production의 고적층 배경 경계 검사는 아니다.
- 관측 산출물은 `test-results/standalone/backgrounds-*/`에 있다. 새 집중 검사는 개발 훅이 필요한 시나리오이며 production에서는 제외한다. 모든 기존 standalone E2E를 이번 세션에 재실행한 것은 아니다.
- 미검증: 실제 Android/iPhone·Safari/Firefox, 사람의 1.2초 전환 체감·주의 분산·숫자 인식 속도, 실기기 메모리/첫 로딩, 실제 CrazyGames 포털 Preview. 실기기 조정은 사용자 요청대로 보류한다.

## 2026-10-09 — 시간대 순환과 크로스페이드 구현

- 변경: 새 배경 세 장을 필수 자산 로더에 연결했다. 구간·순서·조정 시간은 `src/game/backgrounds.ts`, 전환 상태·시간은 Session, 두 배경의 합성은 Scene에 둔다. 규칙은 [시간대 배경](design/backgrounds.md)을 따른다.
- 정적 검토: 성공 적층 시에만 다음 시간대를 선택하고 다른 시간대가 된 경우 한 번 전환한다. Session의 정지·카운트다운·메뉴·결과 guard가 전환 시간을 멈추며 새 판·HOME에서 아침으로 초기화한다. 아래 이미지를 불투명하게 유지한 채 위 이미지에 부드러운 불투명도 곡선을 적용한다. 동전·HUD·Perfect의 불투명도는 바꾸지 않는다. 이는 코드 검토이며 실제 플레이 관측이 아니다.
- `rtk npm run lint`: 성공. `rtk npm run build:crazygames`: TypeScript 검사·production 빌드 성공. 변경 파일 포맷과 `git diff --check`를 확인했다.
- 빌드 자산: 새 PNG 세 장이 `dist/`에 원본과 byte 일치하며 포함됐다. 전체 배포 파일 29개, 17,210,498 bytes(약 17.21 MB). production JS에 `__COIN_TOWER__` 개발 훅이 없음을 확인했다. 파일 크기는 실제 네트워크 첫 로딩 측정값이 아니다.
- 게임 테스트는 추가하거나 실행하지 않았다. 이번 세션에는 사용할 수 있는 브라우저 제어 도구가 없어 게임 화면도 직접 관찰하지 못했다. 5·10·15·20·25개 경계, 전환 도중 정지·재개·실패·재시작, 실제 금화·Perfect 가독성·윤곽 정렬·기기 메모리와 로딩은 런타임 관찰이 필요하다. 이전 검사 통과를 이번 변경의 검증으로 간주하지 않는다.
- 현재 `dist/`는 Space 입력과 시간대 배경을 포함한 CrazyGames 빌드다. 포털 업로드·Preview는 수행하지 않았다.

## 2026-10-09 — 시간대 배경 자산

- 원본 아침 배경을 참조해 점심·노을 진 저녁·밤 PNG 세 장을 생성하고 `public/assets/coin-tower/backgrounds/`에 저장했다. 실제 출력은 점심·밤 941×1672, 저녁 941×1671이며 합계 5,449,799 bytes다.
- 생성 결과를 직접 보고 원본과 큰 배치·시간대 색을 비교했다. PNG 메타데이터와 해시를 확인했고 원본 `sky_ruins.png`의 해시는 변경되지 않았다. 세부 질감·윤곽과 저녁의 1px 높이 차이는 [제작 기록](art/background-time-of-day.md)에 기록했다.
- 런타임 manifest·scene 연결과 높이별 전환은 적용하지 않았다. 게임 테스트·브라우저 검사·빌드는 실행하지 않았으며 실제 동전·Perfect 가독성·전환 정렬·기기 로딩은 미검증이다. 현재 `dist/`는 아래 Space 입력 빌드를 유지한다.

## 2026-10-09 — PC Space 시작·낙하 입력

- 변경: `Shell`에서 Space를 게임 문서 단축키로 받아 첫 화면 시작과 플레이 낙하에 연결했다. 기존 게임 영역 Enter는 유지하며 PLAY·TRY AGAIN·CONTINUE 뒤 게임 영역으로 포커스를 돌린다. 안내·접근성 문구와 기존 문구 검사 기대값을 갱신했다.
- 정적 검토: 키 반복·수정키·IME·이미 처리된 이벤트, 버튼/링크/편집 요소·게임 밖 컨트롤, 로딩·오류·정지·카운트다운·결과는 게임 단축키에서 제외한다. Space 처리는 한 listener에서만 수행하고 시작과 첫 낙하를 같은 호출에 처리하지 않는다. 실제 입력 관측 결과는 아니다.
- `rtk npm run lint`: 성공. `rtk npm run build:crazygames`: TypeScript 검사와 production 빌드 성공. 변경 파일 포맷과 `git diff --check`를 확인했다.
- 게임 테스트·브라우저 검사는 이번 요청에서 추가하거나 실행하지 않았다. 실제 PC Space/누르고 있기·버튼 키보드 동작·포털 iframe 포커스 및 모바일 안내 배치는 미검증이다. 이전 런타임 검사 통과를 이번 입력 변경의 관측으로 간주하지 않는다.
- 현재 `dist/`는 Space 변경을 포함한 새 CrazyGames 빌드다. 이전 `releases/` ZIP에는 이 변경이 없다. 포털은 사용자 보고에 따라 `dist/` 내부 전체를 파일/폴더로 업로드한다.

## 2026-10-08 — CrazyGames Preview 업로드 ZIP

- 대상 소스: `d1bd050`, 패키지 버전 0.1.0. 게임 코드 변경 없이 `rtk npm run build:crazygames` 실행: TypeScript 검사·CrazyGames production 빌드 성공.
- 산출물: `releases/coin-tower-crazygames-0.1.0-20261008-d1bd050.zip`, **10,572,071 bytes(약 10.6 MB)**. 압축 전 11,758,506 bytes, 26개 파일. `releases/`는 생성물로 Git에서 제외한다.
- ZIP SHA-256: `0a6345830f4cae1e4a63e4ba82c02c04329186fd4239c17335108fffce878d39`.
- 패키지 확인: ZIP 최상위 `index.html`, 상대 HTML 링크의 파일 존재, 모든 entry의 경로·CRC·현재 `dist/`와 byte 일치, 21개 게임 자산(콤보 이미지 11개 포함)의 원본 byte 일치를 확인했다. ZIP에는 런타임 HTML/JS/CSS/PNG/SVG/WAV만 포함한다. 번들의 공식 SDK v3 URL과 개발 훅 제외도 확인했다.
- 이번 작업에서 게임 테스트·브라우저 회귀 검사는 재실행하지 않았다. 이전 런타임 관측은 아래 기록을 따른다. 압축 파일 크기는 실제 초기 네트워크 다운로드 측정값이 아니다.
- 현재 개인 기록 플레이 버전의 ZIP이며 주간 리더보드·로그인·클라우드 저장은 아직 연결하지 않았다. 실제 포털 업로드·Preview·리더보드 활성화·심사 제출은 수행하지 않았다. 다음은 이 ZIP을 포털 Preview에 올려 실제 환경을 확인하는 단계다.

## 2026-10-08 — Perfect 콤보 이미지 글자

- 환경: macOS / Node 24.16.0 / npm 11.13.0 / Playwright 1.63.0 Chromium. 데스크톱 마우스·Pixel 7 터치 에뮬레이션이며 실기기 검사는 아니다.
- 범위: 기존 Perfect 스타일의 투명 X·0~9 PNG 11개 생성·분리, Perfect 아래 이미지 숫자 조합, X1부터 표시, 자릿수 축소와 피드백 시간·정지 상태 연동. 원본 Perfect 파일·판정·속도·콤보 집계·저장 schema·SDK 계약은 유지했다.
- 파일: 공통 높이 192px, 폭 145~182px, PNG 총 539,802 bytes(약 527KiB), RGBA 픽셀 합계 약 1.4MiB. 엔진·브라우저의 캐시 복사와 관리 비용은 별도다. 프롬프트·참조·알파 분리·이용 조건은 [ASSET_SOURCES.md](ASSET_SOURCES.md)와 [제작 기록](art/combo-glyphs.md)에 있다.
- `rtk npm run check`: 린트·포맷·타입·standalone 배포 빌드 성공, 단위 검사 6개 파일·65개 통과.
- `rtk npm run test:e2e -- --grep 'deterministic real-input|x100 glyphs|single Perfect'`: 집중 검사 6개 통과. 실제 마우스·터치로 X1·X2·X10·X100, PNG 디코딩·크기·배치, 피드백 시간에 따른 불투명도, 정지·카운트다운 숨김과 재개, NICE·시간 종료 시 숨김, 완료·새로고침을 확인했다.
- `rtk npm run test:e2e`: 전체 개발 브라우저 검사 24개 통과. 새 이미지 피드백과 기존 결과·메뉴·저장·오류 복구·입력·중단·화면 회귀를 포함한다.
- 배포 첫 실행에서 모바일 Clock 검사가 고정 580ms 후에도 `settling`인 상태에서 멈췄다. 실제 `moving` 단계까지 16ms씩 진행하도록 검사 준비를 보완했다. `rtk proxy env E2E_PREVIEW=1 npm run test:e2e -- --grep 'single Perfect' --repeat-each 3`: PC·모바일 각 3회, 6개 통과. 게임 시간·속도·판정 코드는 변경하지 않았다.
- `rtk proxy env E2E_PREVIEW=1 npm run test:e2e`: 재검사에서 standalone 배포 브라우저 16개 통과, 개발 시간 제어 전용 8개 의도적 제외. 개발 훅 없이 X1 PNG·결과 기록·메뉴·새로고침을 확인했다.
- `rtk npm run playtest:touch`: 360×640·390×844의 5·10·20개 관측 2개 통과. 최소 간격 계산을 숫자까지 포함한 영역 기준으로 갱신했고, 실제 브라우저 터치 12회·Perfect·입력 무시·예약 없음 회귀를 확인했다. 실기기 지연이나 사람의 가독성 검사는 아니다.
- `rtk npm run build:crazygames`: 새 PNG를 포함한 제출용 빌드 성공. 검사에 사용한 공식 SDK 원본 파일의 SHA-256은 기존 `DEPENDENCIES.md`의 값과 일치한다.
- `rtk proxy env E2E_PREVIEW=1 CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js npm run test:crazygames`: CrazyGames 배포 회귀 16개 통과(fixture 14개·공식 SDK local 2개). 필수 자산 로딩·기존 SDK 이벤트·음소거·영어 UI·자체 전체화면 숨김·작은 포털 화면을 확인했다. 마지막 `dist/`는 이 검사에 사용한 CrazyGames 빌드이며 실제 포털 Preview 검사는 아니다.
- 화면: 데스크톱·모바일의 X2, 360×640·390×844·821×462의 X100 캡처를 직접 확인했다. 같은 높이의 글자와 기존 Perfect 색·테두리, 두 줄 구분, 다음 이동 동전·탑 상단·일시정지 버튼의 비가림을 관측했다. 공간 경계는 브라우저에서도 단언했다.
- 미검증: 실제 Android/iPhone·Safari/Firefox, 사람의 숫자 인식 속도·다음 입력 체감, 실제 CrazyGames 포털 Preview. 실기기 조정은 사용자 요청대로 보류한다. 가설의 상태와 방법은 [PLAYTEST_NOTES.md](PLAYTEST_NOTES.md)에 있다.

## 2026-10-08 — 결과·메뉴의 두 기록과 항목별 NEW BEST

- 환경: macOS / Node 24.16.0 / npm 11.13.0 / Playwright 1.63.0 Chromium. 데스크톱 마우스·Pixel 7 터치 에뮬레이션이며 실기기 검사는 아니다.
- 범위: 결과의 두 기록 비교 표, 이번 판을 반영한 개인 최고, 항목별 경신 배지, 메뉴의 두 개인 최고. 저장 형식 v2·공통 서비스·SDK·게임 속도·판정·아트는 유지했다.
- `rtk npm run check`: 린트·포맷·타입·standalone 배포 빌드 성공, 단위 검사 6개 파일·65개 통과.
- `rtk npm run test:e2e`: 전체 개발 브라우저 검사 24개 통과. 두 기록·경신 조합·화면 경계와 개발 훅 없는 단일 Perfect 결과 검사, 기존 입력·중단·저장·오류 복구 회귀를 포함한다.
- `rtk proxy env E2E_PREVIEW=1 npm run test:e2e`: standalone 배포 브라우저 검사 16개 통과, 개발 시간 제어 전용 8개 의도적 제외. 실제 Perfect 1회 완료 결과·두 배지·메뉴·새로고침, 구버전 이행·기존 기록 보존·오류 복구를 포함한다.
- `rtk proxy env CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js npm run test:crazygames`: CrazyGames 개발 회귀 16개 통과(fixture 14개·공식 SDK local 2개). 원본 파일 해시는 기존 `DEPENDENCIES.md`와 일치한다. `rtk npm run build:crazygames` 제출용 빌드도 성공했다.
- `rtk proxy env E2E_PREVIEW=1 CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js npm run test:crazygames`: CrazyGames 배포 회귀 16개 통과(fixture 14개·공식 SDK local 2개). 마지막 `dist/`는 검증한 CrazyGames 빌드다. 실제 포털 Preview 검사는 아니다.
- 규칙·상태: 갱신 전 개인 최고와 비교한 완료 결과를 보존해 높이만·콤보만·둘 다 경신, 동점·낮은 기록을 구분한다. 반복 프레임이 배지를 없애거나 완료를 중복 기록하지 않고, 새 판·메뉴에서 완료 결과를 비운다.
- 화면·입력: 개발 시간 제어·합성 준비 후 실제 마우스/터치 실패 입력으로 x0·x1·x12·x100과 두 기록의 값을 확인했다. 360×640·390×844·821×462의 결과·메뉴 캡처를 직접 확인하고 패널·숫자·버튼 경계, 메뉴 두 칸의 같은 크기, 동전 아트 비가림을 검사했다. 개발 훅 없이 브라우저 Clock과 실제 입력으로 Perfect 1회 → 실패 → 두 경신 배지 → 메뉴 → 새로고침의 x1 유지도 확인했다.
- 수정 후 재검증: 제목 PNG 사각형과 패널의 7px 겹침을 발견해 결과 패널을 아래로 조정하고 작은 배지 글자를 키웠다. 모바일 연속 리사이즈 검사는 FIT 반영을 기다리도록 보완했다. Clock 검사의 세 번째 동전이 다시 Perfect로 놓이는 준비 오류는 목표 밖으로 이동한 뒤 실패하도록 고쳤다. 게임 규칙 변경은 없었다.
- 미검증: 실제 Android/iPhone·Safari/Firefox, 사람의 두 기록 이해 속도·작은 글자 체감, 실제 CrazyGames 포털 Preview와 전역 리더보드. 사용자 요청대로 실기기 조정은 보류한다. 방법과 가설은 [PLAYTEST_NOTES.md](PLAYTEST_NOTES.md)에 있다.

## 2026-10-08 — 무제한 콤보와 완료 시 최장 콤보 저장

- 환경: macOS / Node 24.16.0 / npm 11.13.0 / Playwright 1.63.0 Chromium. 데스크톱 마우스·Pixel 7 터치 에뮬레이션이며 실기기 검사는 아니다.
- 범위: x4 표시 제한 제거, 판의 최장 콤보 추적, 첫 실패 때 최고 높이·최고 콤보 독립 저장, v1→v2 저장 형식 이행. 결과·메뉴의 콤보 기록 표시와 전역 리더보드는 이번 범위에 포함하지 않는다.

| 검사                   | 실제 결과                                                         |
| ---------------------- | ----------------------------------------------------------------- |
| `rtk npm run check`    | 린트·포맷·타입·standalone 빌드 성공, 단위 검사 6개 파일·60개 통과 |
| `rtk npm run test:e2e` | 개발 브라우저 검사 20개 통과                                      |

- `rtk proxy env E2E_PREVIEW=1 npm run test:e2e`: standalone 배포 브라우저 검사 14개 통과, 개발 시간 제어 전용 6개 의도적 제외. 실제 v1→v2 이행과 기존 v2 최고 콤보 보존도 배포본에서 확인했다.
- `rtk proxy env CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js npm run test:crazygames`: CrazyGames 개발 회귀 검사 16개 통과(fixture 14개·공식 SDK 원본 local 실행 2개). `rtk npm run build:crazygames` 제출용 빌드도 성공했다.
- `rtk proxy env E2E_PREVIEW=1 CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js npm run test:crazygames`: CrazyGames 배포 회귀 검사 16개 통과(fixture 14개·공식 SDK 원본 local 실행 2개). 마지막 `dist/`는 이 검사에 사용한 CrazyGames 빌드다. 실제 포털 Preview 검사는 아니다.
- 규칙 검사: 첫 동전 콤보 제외, Perfect 없는 판 0·한 번인 판 1, x100까지 실제 횟수, `Perfect 8 → NICE → Perfect 5 → 실패`의 기록 8, 현재 콤보 초기화와 판 최장 보존, 정지·background·재개 보존, 확인 취소·중단·새 판 초기화, 첫 실패 한 번만 저장, 두 개인 최고 독립 비교를 확인했다.
- 저장 검사: 실제 v1 fixture의 높이·판 수를 보존하고 최고 콤보 0을 추가한 v2로 저장·재로드했다. 구버전 손상 데이터와 누락·음수·소수 콤보를 가진 v2, 미래 버전은 원문을 보존한다. 접근 불가·용량 초과 때 플레이와 실패 안내를 유지한다.
- 런타임 검사: 개발 시간 제어와 실제 마우스/터치로 x5·x6·x13, 실패 후 최고 콤보 13 저장·재로드를 확인했다. x99까지 합성 준비 후 실제 입력으로 x100에 도달하고, 완료 전 저장 키가 없고 새로고침 시 중단 판이 사라짐을 확인했다. 정상 플레이 경로에서 수집한 런타임 오류는 0개다.
- 화면 관측: PC·모바일의 x13/x100 캡처를 직접 확인했고 x100 패널 경계 검사가 통과했다. 숫자는 패널 안에 들어오며 이동 동전·목표를 덮지 않는다. 더 긴 숫자는 폭에 맞춰 축소한다. 체감 가설과 한계는 [PLAYTEST_NOTES.md](PLAYTEST_NOTES.md)에 있다.
- 도구 제한: sandbox 내부 첫 브라우저 실행은 `listen EPERM`으로 서버를 열지 못했다. 승인된 서버·Chromium 실행으로 개발 검사를 완료했다. 의도적으로 발생시키는 `recovery fixture`와 `NO_COLOR` 경고는 정상 플레이 오류가 아니다.
- 미검증: 실제 Android/iPhone·Safari/Firefox, 사람의 연속 콤보 성공률·시선 이동·손가락 가림, CrazyGames 포털 Preview/전역 순위. 실기기 조정은 사용자 요청대로 보류한다.

## 2026-10-07 — CrazyGames Basic Launch 준비

- 환경: macOS / Node 24.16.0 / npm 11.13.0 / Playwright 1.63.0 Chromium. 데스크톱 마우스와 Pixel 7 터치 에뮬레이션이며 실기기 검사가 아니다.
- 범위: SDK v3 준비 완료 후 게임 생성, gameplay start/stop, 초기·변경 플랫폼 음소거, 영어 UI/접근성/복구 문구, CrazyGames 빌드의 자체 전체화면 숨김과 호출 차단. 게임 규칙·아트·저장 schema는 유지했다.

| 검사                                                                                                       | 실제 결과                                                                                      |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `rtk npm run check`                                                                                        | 린트·포맷·타입·standalone 배포 빌드 성공, 단위 검사 6개 파일·48개 통과                         |
| `rtk npm run test:e2e`                                                                                     | standalone 개발 브라우저 검사 16개 통과                                                        |
| `rtk proxy env E2E_PREVIEW=1 npm run test:e2e`                                                             | standalone 배포 브라우저 검사 12개 통과, 개발 시간 제어 전용 4개 의도적 제외                   |
| `rtk proxy env CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js npm run test:crazygames`               | CrazyGames 개발 브라우저 검사 16개 통과: fixture 14개 + 실제 SDK local 검사 2개                |
| `rtk npm run build:crazygames`                                                                             | 제출용 빌드 성공: `dist/` 15개 파일, 11,214,961 bytes. 외부 SDK 파일은 이 합계에 포함하지 않음 |
| `rtk proxy env E2E_PREVIEW=1 CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js npm run test:crazygames` | CrazyGames 배포 브라우저 검사 16개 통과: fixture 14개 + 실제 SDK local 검사 2개                |

### SDK 경계와 화면 근거

- 단위 검사: 초기화 한 번·준비 이전 API 호출 방지, init 거부/disabled 환경/다운로드 실패/SDK 누락, 제한 시간 초과·취소·늦은 완료 무시, listener 제거, 런타임 SDK 이벤트 예외 처리, standalone 오프라인 동작, CrazyGames 연동 경로에서 광고·구매·분석 비활성 유지.
- 이벤트 검사: 메뉴/로딩은 시작을 보고하지 않음. 새 판·RETRY·확인된 RESTART와 재개 카운트다운 종료에 start, 수동 정지·첫 실패에 stop. 반복 프레임/확인 취소/이미 정지된 메뉴 전환은 중복하지 않음. 합성 blur/focus/visibility 자체는 SDK 이벤트를 보내지 않으며 복귀 후 명시적 재개만 start를 보냄.
- 음소거: 초기·변경 SDK mute를 `AudioService`에 전달한 테스트 sound manager의 mute에 OR 적용하는 단위 검사와, 브라우저의 버튼·저장 설정 보존 검사를 함께 사용했다. 플랫폼 강제 음소거, 사용자 mute, 일시정지 중 어느 하나라도 남으면 소리를 켜지 않는다. 오디오 청취 검사는 아니다.
- 음소거 검사를 보강해 배포본의 실제 WebAudio masterMuteNode gain을 관측했다. 사용자 입력으로 자동 재생 잠금이 풀린 뒤 플랫폼 mute에서 0, 해제에서 1, 사용자 mute가 남으면 0임을 PC·모바일 브라우저에서 추가 확인했다(`rtk npm run test:crazygames -- --grep 'platform mute'` 및 `rtk proxy env E2E_PREVIEW=1 npm run test:crazygames -- --grep 'platform mute'`, 개발·배포 각각 2개 통과). 초기 잠금 상태의 gain을 즉시 읽는 검사는 렌더 전 값을 반환하므로 입력 후 오디오 렌더를 기다리도록 수정했다. SDK 설정 입력은 fixture이며 실제 포털 음소거 검사는 아니다.
- 브라우저 fixture는 공식 CDN 요청 경로를 테스트 코드로 대체한다. 이 결과를 실제 SDK 또는 CrazyGames 포털 결과로 해석하지 않는다. 실제 SDK 검사는 CDN에서 받은 108,970-byte 원본 파일을 수정 없이 같은 URL 요청에 제공했다. SDK 자체의 `environment === 'local'`과 실제 시작/일시정지/재개 호출·런타임 오류 없음을 확인했다. 원본 해시는 `DEPENDENCIES.md`에 있다.
- SDK 이벤트 시나리오의 마지막 성공·실패 준비는 브라우저 Clock으로 시간을 고정한 뒤 실제 마우스/터치와 RAF 시간을 진행한다. production에 개발 관측 API를 추가하지 않았다. `?debug`에서도 배포본 관측 API가 없음을 검사한다.
- 영어 문구는 숨겨진 메뉴까지 포함해 한국어가 남지 않는지 검사했다. 821×462 DPR 1 포털 크기의 title/pause/confirm 캡처를 직접 확인했다. 자동 폭 검사와 전체화면 숨김 검사도 통과했다. 처음 캡처에서 발견한 확인문의 한국어 잔여 문장을 수정하고 재검사했다.
- 초기 실행에서 소스 수정의 HMR 간섭, 두 검사 묶음의 출력 폴더 공유, 동시 렌더 부하에 따른 실패가 있었다. 출력 경로를 `test-results/standalone/`와 `test-results/crazygames/`로 분리하고 재사용 서버 대신 자체 서버·단일 작업자로 순차 실행해 최종 결과를 확인했다. 실패 재현 준비의 시간 의존성은 브라우저 Clock으로 제거했다.
- 실패 시나리오의 의도적인 SDK 경고 및 `recovery fixture` 오류와 도구의 `NO_COLOR` 경고는 정상 플레이 오류로 계산하지 않는다. CI에 CrazyGames 개발/배포 fixture 검사 경로를 추가했으며 원격 CI 실행은 아직 하지 않았다.
- 미검증: **CrazyGames 포털 업로드·Preview 통신·플랫폼 음소거/전체화면 UI·심사 승인**, 실제 Android/iPhone 및 Safari/Firefox, 물리적 탭/OS 전환, 실제 오디오·터치 지연·네트워크 로딩 체감. 광고·결제·계정·클라우드는 이번 구현 범위가 아니다.
- 마지막 빌드는 CrazyGames용 `dist/`다. 일반 `build`/`check` 실행 뒤 제출하려면 다시 `build:crazygames`가 필요하다. 산출물은 ignore되며 외부 게시를 하지 않았다.

## 2026-10-07 — 5·10·20개 집중 플레이 관측

- 게임 기준: `d121c4e`. 런타임 게임 코드·아트·밸런스는 변경하지 않았다.
- `rtk npm run check`: 린트·포맷·TypeScript·배포 빌드 성공, 단위 검사 35개 통과. 재현 스크립트와 별도 설정도 검사 대상에 포함했다.
- `rtk npm run playtest:touch`: 360×640·390×844 Chromium 터치 에뮬레이션 2개 시나리오 통과. 각 5·10·20개 상태, 실시간 이동, 네이티브 터치 12회, Perfect·입력 무시·예약 없음 확인. 수집한 런타임 오류 없음.
- 캡처에서 Perfect와 이동 동전·탑 상단의 비가림을 확인했다. 20개 중앙 통과 때 희미한 Perfect가 남는 것도 확인했다. 시간 폭·호스트 RAF 수치·주관적 주장 한계는 [최신 플레이 관측](PLAYTEST_NOTES.md)에 기록했다.
- 실제 휴대폰의 터치 감각·손가락 가림·사용자 성공률과 자연스러운 x4 빈도는 미검증이다. 사용자 피드백 수집 후 가설을 다시 평가한다.
- 계측 시점 오류로 첫 실행 2개가 실패해 capture의 microtask 대신 bubble에서 입력 이후 상태를 읽도록 수정했다. 관측 시나리오만 수정했으며 최종 실행은 통과했다.

## 2026-10-07 — 첫 웹 플레이 버전

- 환경: macOS, Node 24.16.0, npm 11.13.0, 고정 의존성 유지.
- 대상: `docs/GAME_DESIGN.md`의 첫 구현 범위. 원본 PNG 9개를 수정 없이 복사하고 SHA-256 일치를 확인했다.

| 검사                                           | 결과                                                                                                                                                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rtk npm run check`                            | ESLint·Prettier·TypeScript·Vite 배포 빌드 성공, 단위 검사 4개 파일·35개 통과                                                                                                                                   |
| `rtk npm run test:e2e`                         | 데스크톱 마우스·Pixel 7 터치 에뮬레이션 Chromium에서 16개 통과                                                                                                                                                 |
| `rtk proxy env E2E_PREVIEW=1 npm run test:e2e` | 배포 빌드의 Chromium 검사 12개 통과, 개발 전용 시간 제어가 필요한 4개 의도적 제외                                                                                                                              |
| 입력·결과                                      | 시작과 낙하 분리, 낙하/정착 중 추가 입력 무시, 첫 실패 즉시 결과, RETRY·HOME, 완료 결과 한 번 저장, 새로고침 후 최고 기록 복원                                                                                 |
| 규칙·진행                                      | 착지 경계·Perfect 경계 단위 검사; 실제 입력과 개발 전용 시간 제어로 21개 적층·x4 상한·일반 성공 초기화·속도 상한·카메라·재시작 초기화 확인                                                                     |
| 중단·재개                                      | 이동·낙하·정착 정지, 3·2·1, 재중단 시 처음부터 카운트다운, 확인/취소, 중단 기록 저장 안 함. 배경 전환은 합성 blur/focus 및 visibility 이벤트로 검사                                                            |
| 화면·오류                                      | 390×844·900×420·1280×800 비율·영역 경계 검사, 데스크톱 전체화면 진입/복귀. 원본 아트 title/result/pause/stack-combo 캡처 확인. 에셋 실패·실행 오류·손상 저장 보존·저장 용량 초과에서도 안내와 복구/플레이 확인 |
| 배포 경계                                      | 개발 전용 `window.__COIN_TOWER__`가 배포본에 없음을 확인                                                                                                                                                       |

- 브라우저 입력은 Playwright의 마우스 클릭과 터치 이벤트를 사용했다. 적층의 정확한 위치·중단 단계 검사는 개발 전용 시간 제어를 함께 사용했다. 자동 측정과 사용자 체감의 구분은 [PLAYTEST_NOTES.md](PLAYTEST_NOTES.md)에 있다.
- 긴 적층 시나리오의 초기 데스크톱 검사 1개가 마지막 단계에서 기본 제한 시간을 초과했다. 실제 입력 22회·원본 PNG 로딩·화면 캡처를 포함하는 해당 검사만 90초로 설정했고 최종 전체 개발 검사는 통과했다.
- 정상 플레이 시나리오에서 수집한 런타임 오류는 없었다. 복구 검사에서 의도적으로 주입한 `recovery fixture` 오류와 실행 도구의 `NO_COLOR` 경고는 검사 실패가 아니다.
- 마지막 일시정지 캡처에서 제목이 이동 동전을 일부 가리는 것을 발견했다. 제목은 이동 경로 위로, 메뉴는 착지 목표 아래로 옮겼으며 브라우저 검사에서 제목·메뉴·소리/전체화면 버튼의 세로 경계도 확인한다.
- 배포 캡처에서 CSS의 상대 URL 기준이 바뀌어 HUD 판이 누락되는 것을 발견했다. 실제 CSS 배경 URL의 이미지 디코딩 검사로 수정 전 실패를 재현한 뒤, 문서 주소 기준 절대 URL로 수정했다. 최종 개발/배포 검사에 이 회귀 검사를 포함했다.
- 효과음 일시정지/재개와 음소거 설정 보존은 단위 검사 및 브라우저 설정 검사로 확인했다. 실제 음질·지연은 청취하지 않았다. BGM은 없다.
- 미검증: 실제 Android/iPhone, Safari/Firefox, 물리적 탭 전환과 OS 앱 전환, 모바일 전체화면, 실제 터치 지연·오디오 청취·저사양 FPS·네트워크 첫 로딩 시간. 약 9MB의 원본 PNG 최적화, 최종 난이도와 재미, 호스팅·외부 서비스는 이 검사로 확정하지 않는다.
- 검사 산출물은 ignore된 `test-results/`와 `playwright-report/`에 있으며 재실행 시 교체된다.

## 2026-10-07 — 초기 설정

- 환경: macOS, Node 24.16.0, npm 11.13.0.
- 대상: Phaser 템플릿 예제, Coin Tower 이름·세로 720×1280·비활성 외부 서비스 설정.
- 템플릿: 0.2.0, commit `b953c81b31cfdb36f73c6462d707a45ec2b8a46d`.

| 검사                                           | 결과                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `rtk proxy npm ci`                             | lockfile 기반 의존성 136개 설치 성공; Phaser 4.2.1 확인                                             |
| `rtk npm run check`                            | ESLint·Prettier·TypeScript·Vite 배포 빌드 성공, 단위 검사 20개 통과                                 |
| `rtk npm run dev`                              | `http://localhost:5173` 서버 실행, HTTP 응답과 Coin Tower 제목 확인                                 |
| `rtk npm run test:e2e`                         | 데스크톱·Pixel 7 크기 Chromium에서 11개 통과, 1개 의도적 제외                                       |
| `rtk proxy env E2E_PREVIEW=1 npm run test:e2e` | preview 서버의 `dist/`에서 11개 통과, 같은 1개 제외                                                 |
| 화면 확인                                      | 개발 결과의 모바일 메뉴·데스크톱 결과 스크린샷 확인; 가로 넘침 없음, 720:1280 비율 검사 통과        |
| Git                                            | 로컬 `main` 초기화, 원격 없음; 캐시·빌드·검사 산출물·환경 파일·로컬 편집기 설정·서명 키 ignore 확인 |

- 브라우저 검사는 Playwright 1.63.0과 설치된 Chromium을 사용했다. 데스크톱 마우스·모바일 합성 터치로 실제 별 수집과 완료 기록 저장을 확인했다. 설정 유지, 중첩 일시정지, 재시작·메뉴 복귀, 손상 저장 보존·명시적 초기화, 외부 서비스 비활성화, 에셋 실패·오류 복구 화면도 통과했다.
- 제외한 검사는 모바일에서 키보드 Escape와 전체화면을 함께 확인하는 시나리오다. 모바일 실제 전체화면 동작은 검증하지 않았다.
- E2E 오류 복구 검사는 `demo failure` 오류를 의도적으로 발생시킨다. 해당 로그는 검사 대상 동작이며 테스트 실패가 아니다.
- 설치된 RTK의 `rtk npm ci`는 `npm run ci`로 해석되어 실패했다. 설치 명령을 `rtk proxy npm ci`로 수정해 성공을 확인했다.
- 이 환경에서는 다운로드·로컬 서버·Chromium 실행에 sandbox 밖 실행 권한이 필요했다. 승인된 실행으로 검사를 마쳤으며 프로젝트 자체의 실행 오류는 남지 않았다.
- 미검증: 실제 Coin Tower 게임플레이(아직 미구현), Safari/Firefox, 실제 Android/iPhone, 터치 지연·성능·오디오 청취, 외부 서비스와 호스팅 배포.
