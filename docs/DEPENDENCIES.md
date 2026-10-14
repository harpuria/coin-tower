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
- 2026-10-11 착지 연출: 설치된 4.2.1의 `Graphics.strokeEllipse`/`fillTriangle`/`fillPoints`와 재사용 `Math.Vector2` 꼭짓점, `SoundConfig.rate`, `WebAudioSound`의 재생 속도 적용과 완료·destroy 수명을 확인했다. Scene Image 크기 변경과 HTML 숫자 transform, Web Audio의 실제 0.88/1.24 재생 속도는 Chromium에서 관찰했다. 새 패키지·lockfile·라이선스 변경은 없다.

## Asset과 서비스

- 배포 이미지 생성 도구(2026-10-14): Python 3.13.14 / Pillow 12.3.0(MIT-CMU, 설치 패키지 메타데이터 확인) / 번들 libwebp 1.6.0. `scripts/art-requirements.txt`가 Pillow 버전을 고정하며 기존 로컬 설치를 사용했다. npm 의존성·lockfile·런타임 SDK 변경은 없다. 일반 빌드는 커밋된 파생 파일을 사용한다. Pillow의 WEBP `lossless`·`exact`와 LANCZOS, Vite 8.3.2의 `copyPublicDir: false`·`writeBundle`, Phaser 4.2.1 `ImageFile`의 HTMLImageElement 디코딩을 설치 소스/타입과 실제 Chromium에서 확인했다. TypeScript의 명시적 `.ts` 설정 import와 JSON import attributes를 사용한다. [최적화 안내](art/optimized-assets.md)를 따른다.

- `public/assets/coin-tower/`의 PNG 9개는 사용자 요청에 따라 모바일 원본을 그대로 복사했습니다. 출처와 원본 일치 해시는 [ASSET_SOURCES.md](ASSET_SOURCES.md)에 있습니다.
- `stack.wav`는 템플릿의 합성 효과음을 재사용한 임시 음원입니다. BGM은 없으며 글꼴은 시스템 폰트입니다. 파비콘 SVG는 프로젝트 초기화 중 작성했습니다.
- CrazyGames 빌드는 공식 HTML5 SDK **v3** CDN `https://sdk.crazygames.com/crazygames-sdk-v3.js`를 실행 중 로드합니다. 확인일 2026-10-07. 이 URL은 major만 고정하며 정확한 patch는 고정할 수 없습니다. npm 의존성 추가나 SDK 재배포는 하지 않습니다. 공식 [초기화 문서](https://docs.crazygames.com/sdk/intro/)와 [game API](https://docs.crazygames.com/sdk/game/)가 계약의 기준이며 소스의 타입은 사용하는 API 범위만 선언합니다. 로컬 검사와 포털 Preview의 구분은 `VALIDATION.md`에 기록합니다.
- 이번 실제 SDK local 검사 파일: 108,970 bytes, SHA-256 `df040bea90f50e8c741415f7594a6883f53ac435e9f08b8a39b7a50c96362681`. 임시 다운로드를 그대로 사용한 관측 기록이며 CDN의 향후 내용 고정을 뜻하지 않습니다.
- 2026-10-14 Basic 점검에서 내려받은 공식 v3 파일: 112,919 bytes, SHA-256 `d4c44671cafbb694a0fd054078303242681bdf1b5908d6fb9f766d1de3f25911`. 수정 없이 배포 SDK local 검사에 사용했고 PC·터치 2개 공식 SDK 검사와 14개 fixture가 통과했다. 실제 포털/실기기 확인과 구분하며 이전 파일 해시는 과거 관측 기록이다. [Basic 점검](basic-launch-readiness.md)을 따른다.
- 광고·결제·분석 SDK 기능은 비활성화 상태입니다. CrazyGames SDK 자체 통신은 해당 플랫폼의 SDK 계약을 따릅니다. 게시 전 개발자 포털의 최신 약관과 배포 조건을 확인합니다.
- 파생 게임은 실제로 쓰는 의존성/asset의 라이선스 고지와 SDK 약관을 직접 관리합니다.

## 업데이트 절차

1. 공식 changelog와 Node 지원 범위를 확인합니다.
2. 정확한 버전으로 설치하고 `package-lock.json`을 함께 커밋합니다.
3. `npm run check`, `npm run test:e2e`, `E2E_PREVIEW=1 npm run test:e2e`를 실행합니다.
4. 이 표와 이 프로젝트의 [검증 기록](VALIDATION.md)을 갱신합니다. 가져온 템플릿 기록은 `template/`에 보존합니다.
