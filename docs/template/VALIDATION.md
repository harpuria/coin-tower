# 검증 기록

## 0.2.0 — 2026-10-07 · Linux x64 · Node 22.22.0

| 검사                            | 결과                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `npm run check`                 | 성공: ESLint, Prettier, Vitest, TypeScript, Vite build       |
| 단위 검사                       | 20개 통과                                                    |
| 개발 빌드 E2E                   | 11개 통과, 1개 의도적 skip(모바일 Escape), desktop + Pixel 7 |
| 배포 빌드 E2E (`E2E_PREVIEW=1`) | 11개 통과, 같은 구성                                         |
| 화면 확인                       | desktop/mobile 결과 화면 screenshot 확인                     |

- 브라우저: 환경에 설치된 Chromium(Playwright build 1194)을 `executablePath`로 지정해 실행. Playwright 1.63.0 번들 Chromium은 아님.
- 문서의 장면·migration 예제 코드는 임시 파일로 타입 검사와 실행 검사를 통과한 뒤 삭제.
- GitHub Actions 첫 PR 실행에서 메인 E2E(desktop)가 별을 못 모아 실패. 키를 실제 시간 650ms만 누르는데, 느린 runner에서는 Phaser가 프레임 delta를 제한해 게임 시간이 느리게 흘러 별까지 닿지 못함. 판이 끝날 때까지 입력을 유지하도록 고친 뒤 CPU 10배 throttling에서 desktop/mobile 3회 연속 통과.
- v7 action(checkout, setup-node, upload-artifact)은 위 원격 실행에서 정상 동작 확인.

## 0.1.0 — 2026-10-04 · macOS arm64 · Node 24.16.0

| 검사                            | 결과                                                   |
| ------------------------------- | ------------------------------------------------------ |
| `npm run check`                 | 성공                                                   |
| 단위 검사 / 개발 E2E / 배포 E2E | 17개 / 8개 / 8개 통과 (Playwright 1.63.0 Chromium 153) |
| `npm audit --omit=dev`          | 알려진 취약점 0건 (확인 시점)                          |
| GitHub Actions                  | `main` 첫 push에서 성공                                |

## 확인한 동작

- Boot/asset preload/메뉴/게임/결과/재시작/메뉴 복귀.
- desktop 방향키, mobile touch 입력으로 실제 별 수집. 한 판 후 최고 기록·횟수 저장과 새로고침 복원.
- 설정 저장, 설정창 열기/닫기, 수동 pause 유지·재개, Escape 토글, 전체화면 진입/나가기.
- Mock 동의 gate와 완료·취소 UI, production에서 unavailable.
- asset 요청 실패 시 안내와 플레이 버튼 비활성화, 처리되지 않은 오류 시 안내 화면.
- 손상 저장의 원본 보존과 명시적 초기화.
- 단위: 순차 migration, 미래 버전 보호, 누락 migration, 접근 거부/용량 오류, 설정과 저장 분리, 동시 서비스 요청, Mock 오류, 중첩 pause와 수동 토글, 음량 범위, 오류 감시, 판 길이 조정값.

## 미검증 범위

- 실제 Android/iPhone 기기, Safari와 Firefox. 모바일 viewport와 합성 touch는 실기기 검증이 아닙니다.
- 실제 게임패드, 실기기 전체화면과 방향 고정(`screen.orientation.lock`).
- 실제 음량을 귀로 듣는 확인, 브라우저/OS별 백그라운드 오디오 정책.
- 외부 광고·결제·분석 SDK와 서버 연동(미포함), 외부 정적 호스팅 업로드, 여러 탭 동시 저장.
