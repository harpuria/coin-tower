# 구조와 계약

`core/`, `services/`, `app.ts`를 고치기 전에 읽는 문서입니다. 사용법은 [개발 안내](DEVELOPMENT.md)에 있습니다.

## 파일 안내

```text
src/main.ts               Phaser 설정, 장면 등록, 오류 감시, HMR 정리
src/app.ts                저장·설정·오디오·일시정지·서비스의 수명 소유
src/config/game.ts        이름, 저장 키 접두사, 해상도, 시작/일시정지 장면, 기능 스위치
src/core/                 게임과 무관하게 재사용하는 코드
  store.ts settings.ts      버전 있는 저장, 설정 schema
  audio.ts pause.ts         음량 적용, 이유별 일시정지
  input.ts navigation.ts    이동 입력 통합, 장면 전환
  screen.ts errors.ts       전체화면/방향 고정, 처리되지 않은 오류 감시
src/services/platform.ts  광고·결제·분석 계약, Mock, unavailable
src/services/crazygames.ts HTML5 SDK v3 초기화·플레이 이벤트·음소거 adapter
src/scenes/               공통 Boot / Preload
src/game/                 게임 전용: session/rules, controller, 장면, 저장 schema, asset 목록
src/ui/Shell.ts           HTML 시작/HUD/결과/일시정지/카운트다운과 주 포인터 입력
tests/unit/ tests/e2e/    공통 경계 단위 검사 / 실제 브라우저 흐름 검사
```

의존 방향: `game/`, `ui/` → `core/`, `services/`. `core/`와 `services/`는 `game/`이나 데모 asset 키를 알지 않습니다.
`App`은 `game/`의 schema와 `Session`을 조립만 하고, 점수·보상 규칙은 `game/`에 둡니다. `Session`은 한 판의 결정적 상태, `GameController`는 행동·완료 저장·오디오 연결을 소유하며 `CoinTowerScene`은 상태를 그립니다.
게임은 외부 SDK를 직접 부르지 않고 `app.platform`을 거칩니다.

별조각 지급 비율과 보상 계산은 `game/economy.ts`가 소유합니다. controller는 Session의 한 번뿐인 완료 이벤트에서 두 개인 기록과 별조각을 같은 진행 envelope에 갱신·flush합니다. 화면 렌더링·재시작·중단·광고 adapter에서 별도로 보상을 지급하지 않습니다. 결과의 획득량·정산 후 누적량은 메모리 완료 결과에, 장기 보유량은 진행 저장에 둡니다.

스킨 목록·가격·이미지/텍스처는 `game/skins.ts`가 소유합니다. controller의 `skinsOpen`·`skinPurchase`·`skinMessage`는 메뉴의 일시적 화면 상태이며 Session이나 저장 데이터에 넣지 않습니다. Shell은 SKINS·확인창·포커스·입력 차단을 표시하고, controller만 구매·장착을 확정합니다. Scene은 저장된 장착 스킨의 동일한 art frame을 메뉴 동전·이동 동전·적층 동전에 사용합니다. 플레이 중에는 스킨 변경을 허용하지 않습니다.

배경 시간대·전환 경과 시간도 Session이 소유합니다. Scene은 불투명한 이전 배경 위에 다음 배경의 불투명도를 올려 그리며 별도 tween 시간을 진행하지 않습니다. 중단·결과에서 모델 시간이 멈추면 배경 전환도 멈춥니다.

착지 반동·접점 입자·PERFECT/X 팝도 `Session.feedbackRemaining`에서 경과 시간을 계산합니다. `game/feedback.ts`는 조정값과 표시 계산을 제공하고 Scene과 Shell이 같은 계산을 사용합니다. 표시용 변형은 모델의 동전 좌표·판정·정착 시간을 바꾸지 않습니다. 별도 tween이나 CSS 애니메이션 시계는 진행하지 않습니다.

## 용어

| 용어         | 뜻                                                                            |
| ------------ | ----------------------------------------------------------------------------- |
| envelope     | 저장 형식 `{ version, data }`. version으로 migration 여부를 판단              |
| dirty        | 메모리 값이 바뀌었지만 아직 localStorage에 쓰지 않은 상태                     |
| flush        | dirty 값을 실제로 쓰기. 성공 여부를 boolean으로 반환                          |
| pause reason | 일시정지 이유(`manual`, `settings`, `hidden`, `service` 등). 모두 풀려야 재개 |
| gate         | 서비스 요청 전 확인 단계: 기능 스위치 → 동의 → 동시 요청 여부                 |
| Adapter      | 실제 SDK를 감싸 `PlatformAdapter` 계약에 맞추는 클래스                        |

## 시작과 정리

1. `main.ts`가 `App`과 `Shell`을 만들고 처리되지 않은 오류 감시를 시작합니다.
2. CrazyGames 모드에서는 `app.platform.initialize()`로 SDK를 먼저 준비한 뒤 Phaser를 만듭니다. 초기화/다운로드는 10초로 제한하며 실패하면 영어 재시도 화면을 표시합니다. 일반 모드에서는 외부 SDK를 로드하지 않습니다. `BootScene`이 `app.attach(game)`으로 오디오, 플랫폼 음소거, 탭 숨김/pagehide 처리, 자동 저장 타이머를 연결합니다.
3. `PreloadScene`이 게임의 `queueAssets`로 asset을 불러오며 진행률을 표시합니다.
   하나라도 실패하면 안내를 띄우고 멈춥니다. 모두 성공하면 `app.ready = true` 후 `startScene`으로 넘어갑니다.
4. 현재 게임은 CoinTower 장면 안의 모델 모드로 시작·플레이·결과를 전환합니다. 별도 장면이 필요한 기능은 기존 `transition()`의 중복 요청 방지 계약을 사용할 수 있습니다.
5. HMR 때는 오류 감시, HTML listener, 타이머, 오디오, 플랫폼 listener/진행 중 초기화, Phaser 게임을 정리합니다. 폐기된 앱의 늦은 초기화 완료는 게임이나 listener를 만들지 않습니다.

`App`은 장면이 바뀌어도 유지됩니다. 렌더 객체는 Phaser 장면 수명을 따르고, native 포인터와 HTML 버튼 listener는 Shell 수명을 따릅니다. 런타임에는 동전 간 물리 시뮬레이션 대신 Session의 착지 규칙을 사용합니다.

## 일시정지

`PauseState`는 이유를 집합으로 보관하고, 모든 이유가 사라질 때만 재개합니다. 그래서 탭 복귀가 수동 정지를 풀지 않습니다.
공통 계층은 `gameConfig.pausableScenes`의 장면과 오디오를 멈춥니다. 현재 Coin Tower에서는 이 목록을 비워 두고 모델의 `paused`/`countdownMs`로 게임 시간을 멈춰 UI와 재개 카운트다운을 유지합니다. controller의 `run` 이유와 환경의 `hidden`/`focus` 이유는 오디오를 중단합니다.

App의 숨김·blur는 게임의 `onBackground`를 호출합니다. controller가 모델에 정지를 유지하므로 환경 이유가 해제되어도 자동으로 재개하지 않습니다. 명시적인 계속하기가 카운트다운을 시작합니다. [ADR 0002](adr/0002-run-simulation-and-interruptions.md)를 함께 읽습니다.

## 저장

`Store<T>`는 envelope 하나를 localStorage 키 하나에 기록합니다. 게임이 `defaults`/`validate`/`migrations`를 제공합니다.
순차 migration과 최종 validate가 모두 성공해야 정상 load로 인정합니다. 갱신하면 dirty가 되고, 판 종료·주기·탭 숨김·pagehide에서 flush합니다.
브라우저 종료 시 이벤트는 보장되지 않으므로 중요한 진행은 즉시 flush합니다.

진행 envelope v4는 기존 기록·별조각과 `ownedSkins`·`equippedSkin`을 함께 보존합니다. v3→v4는 기록/잔액을 유지하고 무료 금화를 보유·장착으로 추가합니다. 알 수 없는 스킨·중복 보유·미보유 스킨 장착 등 읽을 수 없는 v4는 원본을 보호합니다.

`Store.commit(change)`는 검증된 후보를 하나의 envelope로 쓴 다음에만 메모리에 반영합니다. 실패 시 기존 메모리 값과 dirty 상태를 유지하고 unavailable로 전환합니다. 구매는 잔액·보유·장착을 한 번에 commit하며 무료 장착 교체도 commit합니다. 완료 보상의 메모리 누적은 기존 update/flush를 계속 사용하고 스킨 필드를 보존합니다. [ADR 0005](adr/0005-persist-before-publishing-skin-purchases.md)를 따릅니다.

| 상태           | 의미와 동작                                          |
| -------------- | ---------------------------------------------------- |
| ready          | 검증된 데이터, 쓰기 가능                             |
| corrupt        | JSON/schema/migration 실패. 원본 쓰기 차단           |
| future-version | 앱보다 높은 버전. 원본 쓰기 차단                     |
| unavailable    | 접근 거부/용량 부족. 메모리로 플레이, 저장 실패 표시 |

- 실패 상태에서도 `update`는 메모리 값을 바꾸지만 `false`를 반환합니다.
- 원본을 지우는 것은 사용자가 확인한 `reset()`뿐입니다. 게임 저장과 설정은 다른 키라서 서로 지우지 않습니다.
- localStorage는 origin(도메인·포트)별·브라우저별로 분리됩니다. 새 게임은 `storagePrefix`를 바꿔 같은 도메인의 다른 게임과 충돌을 피합니다.
- 여러 탭은 마지막 쓰기가 이깁니다. 암호화·부정행위 방지·서버 동기화가 없으므로 실제 화폐/권한의 원본으로 쓰지 않습니다.

## 오디오, 입력, 화면

- `AudioService`는 master/mute를 sound manager에, music/sfx 음량을 각 sound에 적용합니다. asset 키는 호출하는 쪽이 넘깁니다.
- `sfx(key, { rate?, gain? })`는 재생 속도·높이와 기존 효과음 음량에 곱할 상대 음량을 선택적으로 받습니다. 게임별 값은 controller가 전달합니다. 서비스는 재생 중인 일회성 효과음의 수명을 소유하며 완료·폐기 시 정리합니다. 중단 시 효과음은 끝내고 BGM은 일시정지하므로 재개 후 이전 착지음 조각이 다시 울리지 않습니다.
- 최종 음소거는 사용자 설정 OR 플랫폼 강제 음소거 OR 일시정지입니다. SDK settings listener는 별도 플래그만 바꾸며 저장 설정에 쓰지 않습니다.
- BGM은 사용자 동작 이후 시작하고 일시정지 동안 멈춥니다. 설정을 바꾸면 즉시 반영합니다.
- 현재 낙하 입력은 `#game`의 native 주 pointerdown 한 번으로 받습니다. 터치에서 파생된 별도 마우스 이벤트를 추가로 처리하지 않으며 메뉴는 캔버스의 형제 HTML 요소여서 낙하로 전파되지 않습니다. 게임 영역은 `touch-action: none`입니다. `Shell`의 document keydown은 게임 문서의 Space로 시작/낙하를 연결하고, `#game` keydown은 기존 Enter 입력만 받습니다. Space는 버튼·링크·편집 요소·게임 root 밖의 컨트롤과 반복/수정키/IME 입력을 제외합니다. TAP TO PLAY·TRY AGAIN·CONTINUE 뒤 `#game`으로 포커스를 옮깁니다. 모델의 정지·단계 입력 거부를 유지하며 listener는 Shell의 AbortController로 정리합니다.
- 고정 논리 해상도 + `FIT`. 전체화면 대상은 캔버스와 오버레이를 감싼 `#stage`입니다.
- CrazyGames 빌드에서는 초기화 성공 여부와 관계없이 자체 전체화면 버튼을 숨기고 호출도 차단합니다.

## 서비스

`PlatformServices`는 CrazyGames 모드에서 `CrazyGamesIntegration`의 준비·게임 이벤트·플랫폼 음소거·정리를 소유합니다. game 계층은 전역 SDK를 직접 참조하지 않습니다. `GameController.sync()`는 실제 플레이 가능 상태로의 전환만 보고하며 재개 카운트다운 종료 시 시작을 보고합니다. background callback은 SDK 이벤트 없이 내부 추적 상태만 갱신합니다. SDK가 포커스/visibility를 처리하고 게임 모델은 기존대로 일시정지에 머무릅니다. [ADR 0003](adr/0003-crazygames-basic-launch.md)을 함께 읽습니다.

`PlatformAdapter`는 광고·구매·분석 호출의 교체 지점입니다. 이 기능들의 구현은 개발용 `MockAdapter`와 `UnavailableAdapter`뿐이며 CrazyGames 기본 연동으로 활성화하지 않습니다.
`PlatformServices`가 gate(기능 스위치, 동의, 동시 요청)와 오류 변환을 담당합니다.
Mock 완료 결과에는 `mock: true`가 붙고, 게임 재화/권한을 자동 지급하지 않습니다. Mock 동의는 세션 메모리에만 있습니다.

실제 Adapter 도입 시:

1. 별도 파일에서 SDK를 감싸고, 배포용 선택 경로를 `PlatformServices`에 추가합니다. `isMock` gate도 실제 준비 상태 판정으로 바꿉니다.
2. 광고 완료 callback, 구매 서버 검증·중복 처리·pending·복원 정책을 정합니다.
3. 취소/실패/동의 철회/timeout/중복 callback을 검사합니다. 끝나지 않는 Promise에는 timeout과 요청 ID를 둡니다.
4. SDK 버전·약관·검증 결과를 [의존성](DEPENDENCIES.md)에 기록합니다.

지원하지 않는 기능을 성공으로 가장하지 않습니다. 공유·로그인·리더보드 등은 게임 요구가 정해질 때 추가합니다.
