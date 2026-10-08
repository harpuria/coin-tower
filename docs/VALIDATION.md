# Coin Tower 웹 검증

이 문서는 이 프로젝트에서 실제 실행한 결과만 기록합니다. 템플릿 자체의 과거 검증은 [template/VALIDATION.md](template/VALIDATION.md)에 있습니다.

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
