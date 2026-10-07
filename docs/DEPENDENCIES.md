# 의존성과 출처

확인일: 2026-10-04 (CI action은 2026-10-07). 정확한 전이 의존성은 `package-lock.json`이 기준입니다.

Coin Tower 적용 확인: 2026-10-07, macOS / Node 24.16.0 / npm 11.13.0에서 lockfile 설치·타입 검사·배포 빌드·개발/배포 Chromium 검사가 통과했습니다. 아래 선택 근거와 CI 원격 실행 이력은 가져온 템플릿의 기록입니다. 이 프로젝트의 CI 원격 실행은 아직 하지 않았습니다.

| 구성                | 고정 버전        | 라이선스   | 역할                  |
| ------------------- | ---------------- | ---------- | --------------------- |
| Phaser              | 4.2.1            | MIT        | 게임 런타임           |
| TypeScript          | 6.0.3            | Apache-2.0 | 정적 타입 검사        |
| Vite                | 8.3.2            | MIT        | 개발 서버·번들        |
| Vitest              | 5.0.3            | MIT        | 단위 검사             |
| ESLint / @eslint/js | 10.12.0 / 10.0.1 | MIT        | 린트                  |
| typescript-eslint   | 8.71.0           | MIT        | TypeScript 린트       |
| Prettier            | 3.9.9            | MIT        | 포맷                  |
| @playwright/test    | 1.63.0           | Apache-2.0 | 브라우저 검사         |
| @types/node         | 26.6.4           | MIT        | 도구 설정의 Node 타입 |

런타임 의존성은 Phaser 하나이고 나머지는 devDependencies입니다.
Node.js는 22.12 이상(Vite 8 요구 사항)이 필요하며, 권장 버전은 `.nvmrc`의 24입니다.
CI는 `actions/checkout`, `actions/setup-node`, `actions/upload-artifact` 모두 v7을 사용합니다.

## Phaser 선택 근거

- [공식 릴리스](https://github.com/phaserjs/phaser/releases/tag/v4.2.1)와 npm `latest`가 모두 4.2.1(2026-07-09)입니다.
- 현행 LTS 채널은 없어 최신 안정판을 정확한 버전으로 고정했습니다.
- v4는 렌더러가 크게 바뀌었습니다. Phaser 3 예제의 렌더링 관련 코드는 설치된 타입/소스로 확인한 뒤 사용합니다.

## Asset과 서비스

- `public/assets/demo/`의 SVG와 `public/favicon.svg`는 이 템플릿에서 직접 만든 벡터입니다.
- WAV는 사인파로 합성했습니다. 외부 이미지·음원·폰트가 없고 글꼴은 시스템 폰트입니다.
- 광고·결제·분석 SDK와 외부 전송 endpoint는 없습니다.
- 파생 게임은 실제로 쓰는 의존성/asset의 라이선스 고지와 SDK 약관을 직접 관리합니다.

## 업데이트 절차

1. 공식 changelog와 Node 지원 범위를 확인합니다.
2. 정확한 버전으로 설치하고 `package-lock.json`을 함께 커밋합니다.
3. `npm run check`, `npm run test:e2e`, `E2E_PREVIEW=1 npm run test:e2e`를 실행합니다.
4. 이 표와 [검증 기록](template/VALIDATION.md)을 갱신합니다.
