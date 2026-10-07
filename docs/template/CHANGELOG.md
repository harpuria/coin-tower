# 변경 기록

## 0.2.0 — 2026-10-07

- 공통 코드와 데모 분리: 일시정지 대상을 `gameConfig.pausableScenes`로, 준비 완료 신호를 Preload로, 진행 상태를 `game/session.ts`로 옮김. `AudioService`는 asset 키를 인자로 받음.
- 해상도 고정값 제거: Preload·예제 장면·전환 색이 config와 `this.scale`을 따름.
- 추가: 키보드·게임패드·포인터 통합 이동 입력(`core/input.ts`), 전체화면과 방향 안내(`core/screen.ts`), 처리되지 않은 오류 안내(`core/errors.ts`), 개발용 `?debug`, `pixelArt` 설정, `.env.example`.
- 수정: 다른 이유로 멈춘 동안 일시정지 버튼·Escape가 반응하지 않던 문제.
- E2E: `?round=초`로 예제 판 길이를 줄여 메인 시나리오가 약 40초에서 약 13초로 단축. 수동 일시정지·전체화면·오류 화면 검사 추가. 이동 입력을 판 종료까지 유지해 느린 CI에서도 결과가 일정함.
- CI: action v7, push는 `main`만, 중복 실행 취소, 수동 실행.
- 문서: README를 실행·기능·명령 중심으로 축약, 교체 체크리스트·용어표·입력/화면/디버그 안내 추가, 제작 경위 정리.

## 0.1.0 — 2026-10-04

- Phaser 4.2.1 + TypeScript + Vite 웹 템플릿 생성. `godot-mobile-template`의 공통 기능 / 게임 / 서비스 Adapter 분리 방식을 웹에 맞게 옮김.
- 공통 저장/schema/migration 보호, 설정, 오디오, 전환, pause lifecycle.
- 30초 별 모으기 예제와 반응형 HTML 메뉴·설정·서비스 데모.
- 광고/결제/분석 Mock, 동의 및 동시 실행 gate, 배포 unavailable 기본값.
- 단위/E2E/CI 및 한국어 개발·적용 문서.
