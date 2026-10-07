# Coin Tower 개발 안내

게임 동작은 [GAME_DESIGN.md](GAME_DESIGN.md), 현재 진행과 검증은 [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)와 [VALIDATION.md](VALIDATION.md)를 먼저 읽습니다. 공통 서비스 변경 전에는 [ARCHITECTURE.md](ARCHITECTURE.md)를 읽습니다.

## 작업별 시작 위치

| 작업                                   | 위치                                                   |
| -------------------------------------- | ------------------------------------------------------ |
| 이동·낙하·착지·콤보·카메라·재시작      | `src/game/session.ts`, 시작값은 `src/game/rules.ts`    |
| 행동·완료 저장·오디오·중단 연결        | `src/game/controller.ts`                               |
| PNG 목록·투명 여백 frame               | `src/game/assets.ts`, 출처는 `ASSET_SOURCES.md`        |
| 원본 아트와 탑 렌더링                  | `src/game/scenes.ts`                                   |
| 시작·HUD·결과·일시정지·확인·카운트다운 | `src/ui/Shell.ts`, `src/style.css`                     |
| 이름·해상도·저장 접두사·외부 서비스    | `src/config/game.ts`                                   |
| 저장 schema                            | `src/game/save.ts`; schema 변경 시 구버전 fixture 추가 |
| 공통 저장·소리·브라우저 수명           | `src/core/`, `src/app.ts`                              |

## 실행과 관찰

`rtk npm run dev` 후 `http://localhost:5173`을 엽니다. 휴대폰에서는 같은 네트워크의 Network 주소를 사용합니다. 자동 재생 제한에 따라 첫 소리는 사용자 입력 뒤에만 재생합니다. 현재 BGM은 없고 템플릿에서 가져온 짧은 착지 효과음만 사용합니다.

현재 입력은 HTML 게임 영역의 **native pointerdown**으로 통합합니다. 주 포인터의 왼쪽 버튼/터치 시작만 받고, HTML 메뉴 버튼은 캔버스의 형제 요소로 분리합니다. Phaser mouse/touch 이벤트를 다시 처리하면 입력이 중복될 수 있습니다.

카메라·낙하·피드백은 Session의 게임 시간을 사용합니다. 장면 자체를 pause하면 재개 카운트다운도 멈추므로 이 게임의 `pausableScenes`는 비워 둡니다. 모델이 게임 시간을 멈추고 공통 PauseState는 소리를 멈춥니다. 자세한 이유는 [ADR 0002](adr/0002-run-simulation-and-interruptions.md)에 있습니다.

## 개발 전용 시간 제어

개발 서버에서 `http://localhost:5173/?debug`를 엽니다. 브라우저 콘솔에 다음 API가 생깁니다. production 빌드에는 없습니다.

```js
window.__COIN_TOWER__.snapshot(); // 모드·단계·동전 위치·목표·속도·콤보·카메라·정지 상태
window.__COIN_TOWER__.freeze(true); // 자동 시간 진행만 정지; 실제 UI/포인터 입력은 유지
window.__COIN_TOWER__.advance(100); // 게임 시간을 100ms 진행
window.__COIN_TOWER__.freeze(false);
```

`freeze`는 사용자의 일시정지와 별개인 검사용 기능입니다. `advance`도 실제 한 판이 일시정지된 동안에는 게임을 진행하지 않습니다. 착지 시 남은 시간을 정착/다음 동전에 넘기지 않으므로 단계를 각각 진행해야 합니다.

## 저장과 오류

`coin-tower-web-v1:save`에 완료 기록의 최고 적층 수와 완료 횟수만 저장합니다. 진행 중인 판·콤보·중단 판은 저장하지 않습니다. 설정은 별도 `:settings` 키를 사용합니다. 저장소 접근 실패나 손상 데이터에서는 원본을 덮어쓰지 않고 메모리로 플레이하며 저장 실패를 알립니다.

필수 asset 로딩 실패는 게임을 시작하지 않고 새로고침 안내를 띄웁니다. 처리되지 않은 오류도 화면 위 복구 안내를 보여 줍니다. asset 경로는 Vite BASE_URL을 기준으로 하므로 하위 경로 배포에서도 상대 경로를 유지합니다.

## 검증과 배포

```bash
rtk npm run check
rtk npm run test:e2e
rtk proxy env E2E_PREVIEW=1 npm run test:e2e
```

단위 검사는 착지 경계·점수·콤보·속도·정지·재시작과 공통 저장/서비스를 확인합니다. 브라우저 검사는 실제 마우스·합성 터치, 완료 저장과 복원, 중단, 오류 복구를 확인합니다. 개발 모드에서는 시간 제어를 사용한 21개 적층·카메라·정확한 정지 단계 검사가 추가됩니다. production에서는 그 추가 검사만 제외하고 실제 입력 검사를 실행합니다.

브라우저 검사 산출물은 `test-results/`입니다. 합성 터치와 모바일 화면 크기는 실기기 입력 감각 검증을 대체하지 않습니다. `dist/` 전체를 정적 호스팅에 배포할 수 있고 현재 외부 서비스 연동이나 게시 작업은 하지 않았습니다.
