# Coin Tower Web

좌우로 움직이는 금화를 클릭·탭으로 떨어뜨려 탑을 쌓는 Phaser 웹 2D 캐주얼 게임입니다. 기존 모바일 Coin Tower의 아트를 재사용하며 PC 마우스와 모바일 터치를 지원합니다.

## 실행하기

Node 24 권장, 최소 버전은 `package.json`의 `engines`를 따릅니다.

```bash
rtk proxy npm ci
rtk npm run dev
```

`http://localhost:5173`을 엽니다. 휴대폰은 같은 Wi-Fi에서 개발 서버의 Network 주소로 접속합니다.

## 플레이

- 첫 화면이나 **PLAY**를 누르면 새 판이 시작됩니다. 다음 클릭·탭으로 첫 동전을 떨어뜨립니다.
- 첫 동전은 넓은 받침대에 놓고, 이후에는 맨 위 동전을 겨냥합니다. 성공한 개수가 점수이며 첫 실패에서 끝납니다.
- 동전을 쌓을수록 이동이 빨라집니다. 정확히 맞추면 Perfect 아래에 금색 이미지로 X1·X2…의 실제 연속 횟수를 표시합니다. 판이 실패로 끝나면 최고 높이와 최장 콤보를 브라우저에 각각 저장합니다.
- **TRY AGAIN**으로 바로 새 판을 시작합니다. 최고 기록은 완료한 판만 이 브라우저에 저장됩니다.
- 결과에서 높이·최장 콤보의 이번 판/개인 최고를 비교하고, 경신한 항목에만 **NEW BEST**를 표시합니다. 메뉴에서도 두 개인 최고를 확인할 수 있습니다.
- 일시정지 후 계속하기는 3·2·1 뒤 재개됩니다. 탭을 떠났다가 돌아오면 일시정지 화면에서 기다립니다.
- 소리 버튼으로 짧은 착지 효과음을 켜고 끌 수 있습니다. CrazyGames에서는 플랫폼 음소거가 우선하며 플랫폼의 전체화면 버튼을 사용합니다.

논리 해상도는 세로 720×1280이며 창 크기가 달라도 게임 영역의 비율과 이동 템포를 유지합니다. 게임 영역에 포커스가 있으면 Space·Enter로 시작/낙하할 수도 있고 Escape로 멈출 수 있습니다.

현재 범위는 [첫 플레이 버전 설계](docs/GAME_DESIGN.md)입니다. 기록 목록·업적·로그인·전체 유저 랭킹·클라우드·광고·결제·PWA는 후속 범위입니다. 템플릿 예제나 모바일 저장 기록은 새 웹 최고 기록에 합치지 않습니다.

## 명령

```bash
rtk npm run check          # 린트·포맷·단위 검사·타입 검사·배포 빌드
rtk npm run test:e2e       # PC 마우스·모바일 합성 터치의 Chromium 검사
rtk npm run build         # dist/ 생성
rtk npm run preview       # localhost:4173에서 빌드 확인
rtk proxy env E2E_PREVIEW=1 npm run test:e2e # 빌드 후 배포 결과 검사
```

Playwright 브라우저가 없다면 `rtk proxy npx playwright install chromium`을 한 번 실행합니다. 배포할 때는 `dist/` 전체를 정적 호스팅에 올립니다. 현재 외부 배포는 하지 않았습니다.

## CrazyGames용 실행·빌드

게임 UI는 영어이며 SDK v3 연동은 CrazyGames 전용 모드에서 활성화됩니다.

```bash
rtk npm run dev:crazygames
rtk npm run test:crazygames
rtk npm run build:crazygames
rtk proxy env E2E_PREVIEW=1 npm run test:crazygames
```

제출물은 **`build:crazygames`로 생성한 `dist/` 전체**입니다. 이후 일반 `build`/`check`를 실행하면 standalone 빌드로 바뀝니다. SDK 초기화·플레이 이벤트·음소거·실패 처리와 실제 SDK local 검사 방법은 [개발 안내](docs/DEVELOPMENT.md#crazygames-basic-launch)에 있습니다. CrazyGames 포털 업로드·Preview 확인은 아직 하지 않았습니다.

## 문서 안내

- [게임 규칙과 범위](docs/GAME_DESIGN.md)
- [현재 구현 상태](docs/IMPLEMENTATION_PLAN.md)
- [이 프로젝트의 검증](docs/VALIDATION.md) · [플레이 테스트 노트](docs/PLAYTEST_NOTES.md)
- [아트·효과음 출처](docs/ASSET_SOURCES.md)
- [개발 안내](docs/DEVELOPMENT.md) · [구조와 계약](docs/ARCHITECTURE.md)
- [설정과 원본 프로젝트](docs/SETUP.md) · [의존성](docs/DEPENDENCIES.md)

## 출처

[phaser-web-template](https://github.com/harpuria/phaser-web-template) 0.2.0, commit `b953c81b31cfdb36f73c6462d707a45ec2b8a46d`를 2026-10-07에 적용했습니다. 이후 확정된 Coin Tower 규칙과 원본 모바일 아트를 웹 플레이에 연결했습니다.
