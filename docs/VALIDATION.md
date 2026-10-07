# Coin Tower 웹 검증

이 문서는 이 프로젝트에서 실제 실행한 결과만 기록합니다. 템플릿 자체의 과거 검증은 [template/VALIDATION.md](template/VALIDATION.md)에 있습니다.

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
