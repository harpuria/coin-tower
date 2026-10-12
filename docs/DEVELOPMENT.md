# Coin Tower 개발 안내

게임 동작은 [GAME_DESIGN.md](GAME_DESIGN.md), 현재 진행과 검증은 [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)와 [VALIDATION.md](VALIDATION.md)를 먼저 읽습니다. 공통 서비스 변경 전에는 [ARCHITECTURE.md](ARCHITECTURE.md)를 읽습니다.

## 작업별 시작 위치

| 작업                                   | 위치                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| 이동·낙하·착지·콤보·카메라·재시작      | `src/game/session.ts`, 시작값은 `src/game/rules.ts`                               |
| 행동·완료 저장·오디오·중단 연결        | `src/game/controller.ts`                                                          |
| PNG 목록·투명 여백 frame               | `src/game/assets.ts`, 출처는 `ASSET_SOURCES.md`                                   |
| 원본 아트와 탑 렌더링                  | `src/game/scenes.ts`                                                              |
| 시간대 배경 구간·순서·전환 시간        | `src/game/backgrounds.ts`, 전환 상태는 `session.ts`, 두 배경 렌더링은 `scenes.ts` |
| 시작·HUD·결과·일시정지·확인·카운트다운 | `src/ui/Shell.ts`, `src/style.css`                                                |
| 이름·해상도·저장 접두사·외부 서비스    | `src/config/game.ts`                                                              |
| 저장 schema                            | `src/game/save.ts`; schema 변경 시 구버전 fixture 추가                            |
| 별조각 지급 비율·보상 계산             | `src/game/economy.ts`; 완료 시 지급·저장은 `controller.ts`                        |
| 공통 저장·소리·브라우저 수명           | `src/core/`, `src/app.ts`                                                         |

## 실행과 관찰

`rtk npm run dev` 후 `http://localhost:5173`을 엽니다. 휴대폰에서는 같은 네트워크의 Network 주소를 사용합니다. 자동 재생 제한에 따라 첫 소리는 사용자 입력 뒤에만 재생합니다. 현재 BGM은 없고 템플릿에서 가져온 짧은 착지 효과음만 사용합니다.

메인 화면의 `#play`는 파란 판 없이 `tap_to_play.png`를 표시하는 네이티브 버튼입니다. 표시 문구는 TAP TO PLAY이며 접근성 이름은 Tap to play입니다. 클릭/키보드 활성화는 시작만 수행하고 포커스를 게임 영역으로 옮깁니다. 일반 캔버스 클릭·터치와 문서 Space도 메뉴 시작을 지원합니다. 필수 이미지 로더가 완료될 때까지 시작을 비활성화합니다.

현재 입력은 HTML 게임 영역의 **native pointerdown**으로 통합합니다. 주 포인터의 왼쪽 버튼/터치 시작만 받고, HTML 메뉴 버튼은 캔버스의 형제 요소로 분리합니다. Phaser mouse/touch 이벤트를 다시 처리하면 입력이 중복될 수 있습니다.

PC에서는 게임 문서에 포커스가 있을 때 Space로 시작/낙하를 받습니다. 게임 영역 클릭 없이 첫 화면에서 시작할 수 있으며 시작과 첫 낙하는 별도 입력입니다. 반복 keydown은 무시하고 게임 단축키의 페이지 스크롤은 막습니다. 포커스된 버튼·링크·입력 필드에는 단축키를 적용하지 않습니다. TAP TO PLAY·TRY AGAIN·CONTINUE 뒤 게임 영역에 포커스를 돌려주며, 기존 Enter는 게임 영역 포커스에서만 동작합니다. 정지·카운트다운·결과·로딩·오류 상태는 게임 단축키로 진행하지 않습니다.

Perfect 콤보는 원본 Perfect PNG 아래에 `public/assets/coin-tower/combo/`의 X·0~9 PNG를 조합합니다. `Shell`은 횟수가 바뀔 때만 글자 노드를 교체하고, 피드백을 표시하는 동안 RAF에서 Session의 잔여 시간을 읽어 불투명도를 맞춥니다. 별도의 게임 시간을 진행하지 않으며 정지·카운트다운·종료 때 숨기고 RAF를 해제합니다. 모든 글자는 필수 자산 로더에서 미리 읽습니다. 제작 사양·출처는 [ART_DIRECTION.md](ART_DIRECTION.md)와 [ASSET_SOURCES.md](ASSET_SOURCES.md)를 따릅니다.

기록·별조각 아이콘 3종은 `assets.ts`에서 필수 이미지로 미리 읽고 Shell의 HTML 이미지로 표시합니다. `src/style.css`의 `.stat-icon`은 원본 픽셀을 바꾸지 않고 투명 여백·표시 크기를 맞춥니다. 기록·재화는 `.stat-readout`·`.shard-readout`의 외곽선/그림자로 표시하고 패널 이미지는 실제 버튼에만 사용합니다. 메뉴·결과·HUD는 같은 아이콘을 재사용하며 `record()`의 자릿수 변수로 숫자를 축소합니다. HUD의 기록과 별조각은 저장 서비스 값이며 진행 중 점수와 현재 콤보는 별도로 유지합니다. 실제 배치와 크기 편집 위치는 [제작·적용 기록](art/ui-icons.md#런타임-적용--2026-10-12)에 있습니다.

착지 반동·입자·Perfect/X 팝과 일반/Perfect 효과음 차이의 조정값은 `src/game/feedback.ts`에 있습니다. Scene과 Shell은 같은 표시 계산을 사용하며 Session의 `feedbackRemaining`으로 시간을 맞춥니다. `AudioService.sfx`는 controller가 넘기는 rate/gain을 적용하고 중단 시 일회성 소리를 정리합니다. 현재 음원은 기존 임시 WAV를 재사용합니다. 동작 줄이기는 초기 OS 설정 또는 저장된 `reducedMotion`을 따릅니다. 규칙·체감 목표는 [착지 연출](design/feedback.md)을 읽습니다.

카메라·낙하·피드백은 Session의 게임 시간을 사용합니다. 장면 자체를 pause하면 재개 카운트다운도 멈추므로 이 게임의 `pausableScenes`는 비워 둡니다. 모델이 게임 시간을 멈추고 공통 PauseState는 소리를 멈춥니다. 자세한 이유는 [ADR 0002](adr/0002-run-simulation-and-interruptions.md)에 있습니다.

## 개발 전용 시간 제어

개발 서버에서 `http://localhost:5173/?debug`를 엽니다. 브라우저 콘솔에 다음 API가 생깁니다. production 빌드에는 없습니다.

```js
window.__COIN_TOWER__.snapshot(); // 모드·단계·위치·속도·combo·maxCombo·카메라·정지·background 상태
window.__COIN_TOWER__.background(); // 실제 배경 두 Image의 texture key·alpha·visible·표시 크기
window.__COIN_TOWER__.freeze(true); // 자동 시간 진행만 정지; 실제 UI/포인터 입력은 유지
window.__COIN_TOWER__.advance(100); // 게임 시간을 100ms 진행
window.__COIN_TOWER__.freeze(false);
```

`freeze`는 사용자의 일시정지와 별개인 검사용 기능입니다. `advance`도 실제 한 판이 일시정지된 동안에는 게임을 진행하지 않습니다. 착지 시 남은 시간을 정착/다음 동전에 넘기지 않으므로 단계를 각각 진행해야 합니다.

`snapshot().background`는 `from`/`to` 시간대와 0~1의 `progress`를 포함합니다. Scene은 이 진행률에 부드러운 곡선을 적용해 다음 배경을 덮습니다. 배경 시간도 `advance`를 따르며 정지·카운트다운·결과에서 진행하지 않습니다. 두 이미지는 같은 논리 화면 크기로 표시합니다. 시간대 자산 세 장은 필수 로더로 미리 읽으며 추가 요청을 기다리느라 전환을 멈추지 않습니다.

`window.__COIN_TOWER__.feedback()`는 착지 피드백 잔여 시간, 실제 최상단 Scene 동전의 좌표·표시 크기, NICE/PERFECT 표시 크기·가시성, 접점 Graphics의 가시성·불투명도를 읽습니다. `advance(42)`의 일반 최대 눌림, `advance(54)`의 Perfect 최대 눌림, `advance(90)`의 Perfect 팝 최대점을 관찰할 수 있습니다. 모두 착지 직후부터의 경과 시간입니다. 숫자 팝은 `.combo-glyphs`의 실제 CSS transform에서 함께 확인합니다. 이 관측 API도 production에서 제외합니다.

## 착지 허용 범위 집중 브라우저 검사

`rtk npm run test:e2e -- landing.spec.ts`는 desktop/Pixel 7 Chromium에서 실제 마우스·Space·터치 입력과 개발 시간 제어를 사용한다. 새 판에서 첫 동전을 중앙에 놓고, 다음 동전의 좌우 성공 경계·경계 바로 밖·이전 범위에서는 실패했던 치우침·Perfect 경계와 바로 밖을 각각 확인한다. 점수·동전 위치를 직접 덮어쓰지 않는다.

- 성공 동전의 실제 치우침 유지, 점수·NICE/Perfect·콤보·첫 실패 종료도 확인한다. `test-results/standalone/landing-*/landing-*.png`에 각 경우의 캡처를 저장한다.
- 정확한 좌표 관찰은 개발 훅을 사용하므로 production에서는 제외한다. 단위 경계 회귀는 `tests/unit/session.test.ts`에 있다. 최종 판정 값은 [게임 디자인](GAME_DESIGN.md#플레이-테스트용-시작값)을 따른다.

## 시간대 배경 집중 브라우저 검사

`rtk npm run test:e2e -- backgrounds.spec.ts`는 desktop/Pixel 7 Chromium에서 실제 마우스·Space·터치 입력과 개발 시간 제어로 구간에 도달한다. 동전 위치나 점수를 직접 덮어쓰지 않는다. 5·10·15·20·25개 전환의 시작·25%·50%·75%·완료 시점에 모델과 실제 Scene Image의 texture·alpha·표시 크기를 비교한다.

- 페이드 중 수동 정지, 재개 카운트다운, 합성 blur/focus로 인한 재중단, 확인 취소·재시작·HOME, 첫 실패 시 유지·TRY AGAIN을 검사한다. 마지막에는 자동 RAF로 페이드가 진행하고 완료되는지도 확인한다.
- `test-results/standalone/`의 해당 프로젝트별 디렉터리에 `bg-{5,10,15,20,25}-{start,middle,complete}.png`, 각 시간대의 `bg-{6,11,16,21}-perfect.png`, 재시작·결과 캡처를 저장한다. JSON attachment에는 모델과 실제 렌더 객체 값이 들어간다. 이후 같은 출력 디렉터리의 검사를 실행하면 교체될 수 있다.
- 이 검사는 개발 훅이 없는 production에서는 의도적으로 제외한다. 실제 포털·기기·사람의 조작 체감·실제 탭 전환 검증을 대신하지 않는다.

## 5·10·20개 터치 플레이 테스트

`rtk npm run playtest:touch`는 별도 개발 서버 `:4175`에서 360×640·390×844 Chromium 터치 에뮬레이션을 순차 실행합니다. 일반 E2E와 분리된 관측용 시나리오이며 배포용 명령이 아닙니다.

- 준비: `/?debug`의 시간 제어와 합성 pointer 입력으로 성공 5·10·20개 상태를 만듭니다. 이 준비를 사람의 플레이나 자연스러운 Perfect 빈도로 해석하지 않습니다.
- 관측: 실시간 왕복 이동의 RAF 간격을 모으고, 정확한 중앙에 시간을 고정한 상태에서 `page.touchscreen.tap`으로 낙하 및 낙하 중 추가 터치를 보냅니다. 점수·Perfect·입력 예약 없음은 단언하고, 가독성은 화면으로 관찰합니다.
- 산출물: `test-results/touch-playtest/`의 프로젝트별 `observations.json`과 `5/10/20-{moving-perfect,center-pass,landing-perfect,next-moving-perfect}.png`. 일반 E2E 또는 같은 명령 재실행 시 교체될 수 있습니다.
- 해석: 판정 시간 폭과 이미지 간격은 규칙·렌더 배치에서 계산합니다. 최소 세로 간격은 Perfect와 아래 숫자를 포함한 영역의 하단을 기준으로 합니다. 이벤트 capture→bubble 및 다음 RAF 시간은 브라우저 내부 계측으로 하드웨어·OS 지연이나 화면 표시 완료 시간이 아닙니다. RAF 간격도 이 호스트의 결과이며 실제 휴대폰 FPS 보장은 아닙니다.

실제 기기에서는 같은 위치를 반복 탭하며 5·10·20개 구간의 너무 빠름/늦음, 실패 납득 가능성, Perfect를 읽느라 다음 탭을 놓치는지, 손가락이 동전·목표를 가리는지를 기록합니다. 기종·브라우저·판 수와 함께 사용자 피드백을 `PLAYTEST_NOTES.md`에 구분해 추가합니다.

## 저장과 오류

`coin-tower-web-v1:save`의 envelope v3에 완료 기록의 최고 적층 수(`best`), 최고 콤보(`bestCombo`), 완료 횟수(`rounds`)와 보유 별조각(`shards`)을 저장합니다. v1→v2는 최고 적층 수·완료 횟수를 보존하고 최고 콤보 0을 추가하며, v2→v3는 기존 세 값을 보존하고 별조각 0을 추가합니다. 과거 기록으로 별조각을 소급 지급하지 않습니다. 이행 사례는 `tests/fixtures/progress-migrations.json`에 있습니다. 진행 중인 판·현재 콤보·중단 판은 저장하지 않습니다. 집계·확정 규칙은 [기록 설계](design/records.md)와 [수집 설계](design/economy.md)를 따릅니다. 설정은 별도 `:settings` 키를 사용합니다. 저장소 접근 실패나 손상 데이터에서는 원본을 덮어쓰지 않고 메모리로 플레이하며 저장 실패를 알립니다.

`GameController.result`는 완료한 판의 값·갱신된 개인 최고·갱신 전 값과 비교한 항목별 경신 여부를 메모리에 보존합니다. Shell은 이 완료 결과로 비교 표와 배지를 그리며 새 판·메뉴에서 결과를 비웁니다. 저장 schema에 배지나 마지막 판을 추가하지 않습니다. 메뉴는 저장 서비스의 두 개인 최고를 읽습니다. 저장 실패 시 메모리 결과는 표시하지만 기존 실패 안내도 유지합니다.

완료 결과에는 `shardsEarned`와 `shardsTotal`도 포함합니다. controller가 단 한 번 발생하는 `finished` 이벤트에서 두 기록·완료 횟수·별조각을 같은 envelope에 갱신하고 즉시 flush합니다. 별조각 계산과 정수 범위 보호는 `economy.ts`에 있으며 보유량은 안전한 정수 최댓값에서 포화시켜 저장 유효성을 유지합니다. 결과 패널은 획득량·보유량, 메뉴는 저장 서비스의 보유량을 읽습니다. 저장 실패 뒤에도 같은 페이지의 메모리 누적은 유지하지만 원본은 보존하고 자동 복구 저장은 하지 않습니다. 새로고침하면 마지막 정상 저장 상태로 돌아옵니다.

필수 asset 로딩 실패는 게임을 시작하지 않고 새로고침 안내를 띄웁니다. 처리되지 않은 오류도 화면 위 복구 안내를 보여 줍니다. asset 경로는 Vite BASE_URL을 기준으로 하므로 하위 경로 배포에서도 상대 경로를 유지합니다.

## 검증과 배포

### CrazyGames Basic Launch

플레이 UI는 영어입니다. 일반 `dev`/`build`는 SDK 없이 실행되며, CrazyGames용 실행물은 아래 전용 명령으로 만듭니다.

```bash
rtk npm run dev:crazygames
rtk npm run test:crazygames
rtk npm run build:crazygames
rtk proxy env E2E_PREVIEW=1 npm run test:crazygames
rtk npm run preview
```

CrazyGames에 제출할 파일은 **`build:crazygames` 직후의 `dist/` 전체**입니다. `check`/`build`를 나중에 실행하면 standalone 출력으로 바뀌므로 다시 `build:crazygames`를 실행합니다. 상대 asset 경로는 두 빌드 모두 유지합니다. Preview 명령은 마지막 빌드 결과를 그대로 제공합니다.

#### 포털 등록·Preview·심사 순서

1. 개발자 가입 후 포털의 **`Submit a game`** 흐름에서 게임 정보 입력·빌드 업로드·Preview를 진행합니다. 공식 안내는 최종 제출 전에 Preview로 여러 버전을 확인할 수 있다고 설명합니다. 이 문서에서 포털 버튼·필드 전체를 직접 관찰한 것은 아닙니다. [공식 Preview 안내](https://docs.crazygames.com/#testing-your-game)
2. 업로드 산출물은 위 CrazyGames 빌드의 **`dist/` 내부 전체**입니다. 사용자는 포털이 압축 업로드를 지원하지 않는다고 보고했으므로 파일/폴더 업로드를 사용합니다. 업로드 루트에 `index.html`·`favicon.svg`·`assets/`가 오도록 상대 경로와 하위 폴더를 유지합니다. `releases/`의 `coin-tower-crazygames-0.1.0-20261008-d1bd050.zip`은 이전 코드의 보관용 생성물이며 최신 Space 변경을 포함하지 않습니다. 최신 배포는 새 `build:crazygames` 결과를 사용합니다.
3. 포털 Preview에서 로딩·마우스/터치·재시도·일시정지·SDK 이벤트·음소거·플랫폼 전체화면을 확인한 뒤 최종 QA 심사를 제출합니다. 초기 QA → Basic Launch → 성과에 따른 Full Launch 검토가 공식 흐름입니다. [출시 절차](https://docs.crazygames.com/)
4. **리더보드는 별도 초대 기능**입니다. 게임 가입/업로드/심사만으로 자동 활성화된다고 가정하지 않습니다. 게임의 Leaderboard 설정이 가능한지 확인하고, 보이지 않으면 포털/지원 채널에서 해당 게임의 자격·활성화 가능 여부를 문의합니다. 리더보드 없이 기존 개인 기록 버전으로 Basic Launch 준비를 진행할 수 있습니다. [기능 제약](https://docs.crazygames.com/sdk/leaderboards/)

주간 적층 순위표 하나·플랫폼 위젯·클라이언트 SDK 제출은 채택했으며 아직 구현하지 않았습니다. 전체 기간 브라우저 최고 적층 수·최고 콤보는 유지합니다. 현재 규칙은 [기록 설계](design/records.md), 단계별 연결 계획은 [구현 계획](IMPLEMENTATION_PLAN.md)을 따릅니다.

#### 현재 SDK 연동과 로컬 검증

- SDK는 공식 v3 CDN을 로드하고 `init()`을 기다린 뒤 Phaser를 시작합니다. 다운로드·초기화가 실패하거나 10초를 넘기거나 SDK 환경이 disabled이면 시작을 차단하고 영어 RELOAD 화면을 제공합니다. 일반 정적 호스팅은 standalone 빌드를 사용합니다.
- localhost/127.0.0.1의 실제 SDK는 local 환경입니다. LAN에서 SDK 개발 검사가 필요하면 공식 `?useLocalSdk=true`를 사용합니다. 이 로컬 기능은 CrazyGames 포털 Preview 검증을 대신하지 않습니다.
- 게임 시작·RETRY·확인된 RESTART와 재개 카운트다운 종료에 `gameplayStart`, 수동 일시정지·결과·플레이 종료에 `gameplayStop`을 보냅니다. 반복 프레임은 중복 이벤트를 보내지 않습니다. 탭 숨김/blur/focus만으로 이벤트를 보내지 않으며 SDK가 처리합니다. 복귀 후 게임은 기존처럼 정지 상태를 유지하고 명시적으로 재개합니다.
- 초기 `game.settings.muteAudio`와 변경 listener를 적용합니다. 플랫폼 음소거 중 소리 버튼은 비활성화되며 플랫폼 해제 후 기존 사용자 설정으로 돌아갑니다. 플랫폼 상태는 localStorage에 쓰지 않습니다.
- CrazyGames 빌드는 자체 전체화면 버튼과 호출을 차단합니다. 광고·결제·분석·로그인·클라우드 저장을 활성화하지 않습니다. standalone과 같은 게임 저장 schema를 사용하며 소리 설정은 별도 키에 보존합니다.
- `test:crazygames`는 SDK 다운로드 경로를 결정적 fixture로 대체해 초기화 순서·이벤트·음소거·실패 복구·821×462 화면을 검사합니다. 실제 SDK local 검사는 아래처럼 공식 파일을 임시로 받아 별도로 실행합니다. 이 파일을 저장소에 추가하지 않습니다.

```bash
rtk proxy curl --fail --silent --show-error https://sdk.crazygames.com/crazygames-sdk-v3.js -o /private/tmp/coin-tower-crazygames-v3.js
rtk proxy env CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js npm run test:crazygames
# build:crazygames 후 같은 실제 SDK를 배포본에서 검사
rtk proxy env E2E_PREVIEW=1 CG_SDK_FILE=/private/tmp/coin-tower-crazygames-v3.js npm run test:crazygames
```

파일을 지정하지 않으면 실제 SDK local 검사 2개만 명시적으로 제외합니다. fixture 검사를 실제 플랫폼 승인으로 해석하지 않습니다. Preview 업로드 뒤 SDK 통신·플랫폼 음소거·플랫폼 전체화면·재시작/재개 이벤트를 최종 확인합니다. SDK API 기준은 [공식 초기화 문서](https://docs.crazygames.com/sdk/intro/), [game 문서](https://docs.crazygames.com/sdk/game/)입니다.

### Standalone 회귀 검사

```bash
rtk npm run check
rtk npm run test:e2e
rtk proxy env E2E_PREVIEW=1 npm run test:e2e
```

단위 검사는 착지 경계·점수·콤보·속도·정지·재시작과 공통 저장/서비스를 확인합니다. 브라우저 검사는 실제 마우스·합성 터치, 완료 저장과 복원, 중단, 오류 복구를 확인합니다. 개발 모드에서는 시간 제어를 사용한 21개 적층·카메라·정확한 정지 단계 검사가 추가됩니다. production에서는 그 추가 검사만 제외하고 실제 입력 검사를 실행합니다.

브라우저 검사 산출물은 `test-results/standalone/`와 `test-results/crazygames/`입니다. 각 검사는 다른 출력 폴더와 자체 서버를 사용합니다. 호스트의 렌더 부하와 포커스 간섭을 줄이도록 두 묶음은 순서대로 실행합니다. 합성 터치와 모바일 화면 크기는 실기기 입력 감각 검증을 대체하지 않습니다. 외부 게시 작업은 하지 않았습니다.
