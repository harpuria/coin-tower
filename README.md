# Coin Tower Web

[결정] 기존 모바일 Coin Tower를 Phaser 기반의 웹 2D 캐주얼 게임으로 만듭니다. 세로 구도를 유지하며 PC·모바일 브라우저에서 마우스·터치를 지원합니다.

현재는 **개발 기반 확인용 별 모으기 예제**가 실행됩니다. 동전 낙하·적층·Perfect·콤보 등 기존 게임은 아직 이식하지 않았습니다.

## 실행하기

Node 24 권장, 최소 버전은 `package.json`의 `engines`를 따릅니다.

```bash
rtk proxy npm ci
rtk npm run dev
```

`http://localhost:5173`을 엽니다. 휴대폰은 같은 네트워크에서 개발 서버의 Network 주소로 접속합니다. 예제는 `플레이 시작` 후 방향키·WASD 또는 화면을 누른 위치로 이동해 별을 모읍니다. 동전 낙하 입력은 이식 단계에서 추가합니다.

논리 해상도는 720×1280이며 화면에 맞춰 비율을 유지합니다. 예제 기록과 소리 설정은 현재 브라우저에만 저장됩니다. 광고·결제·분석은 비활성화되어 있고 로그인·전체 유저 랭킹·클라우드 저장·PWA 오프라인 지원은 포함하지 않습니다.

## 명령

```bash
rtk npm run check          # 린트·포맷·단위 검사·타입 검사·배포 빌드
rtk npm run test:e2e       # 데스크톱·모바일 크기의 Chromium 예제 검사
rtk npm run build         # dist/ 생성
rtk npm run preview       # 빌드 결과를 localhost:4173에서 확인
rtk proxy env E2E_PREVIEW=1 npm run test:e2e # 빌드 후 배포 결과 검사
```

Playwright 브라우저가 설치되지 않았다면 `rtk proxy npx playwright install chromium`을 한 번 실행합니다. `dist/`를 정적 호스팅에 배포할 수 있습니다. 현재 외부 배포는 하지 않았습니다.

## 문서

- [첫 웹 플레이 버전의 규칙과 범위](docs/GAME_DESIGN.md): 동전 낙하·적층·실패·재시작과 완료 조건
- [설정과 이식 범위](docs/SETUP.md): 확정된 방향, 원본 프로젝트, 미결 사항, 템플릿 출처
- [이 프로젝트의 검증 기록](docs/VALIDATION.md): 실제 실행한 검사와 미검증 환경
- [개발 안내](docs/DEVELOPMENT.md): 장면·에셋·저장·입력·배포
- [구조와 계약](docs/ARCHITECTURE.md): 재사용 계층과 게임 코드의 경계
- [의존성](docs/DEPENDENCIES.md): 정확한 버전·라이선스·호환성
- [웹 전환 ADR](docs/adr/0001-web-platform.md): 기술 방향과 결과
- [템플릿 적용 절차](docs/template/APPLYING.md) · [템플릿의 과거 검증](docs/template/VALIDATION.md)

## 출처

[phaser-web-template](https://github.com/harpuria/phaser-web-template) 0.2.0을 2026-10-07에 적용했습니다. 적용 commit: `b953c81b31cfdb36f73c6462d707a45ec2b8a46d`. 원본의 Git 이력 대신 이 프로젝트의 로컬 `main` 저장소를 초기화했습니다.
