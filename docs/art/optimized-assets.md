# 배포 이미지 최적화

## 현재 구조

- 사용자 요청: 원본 아트를 보존하고 CrazyGames 초기 다운로드를 20MB 아래로 줄인다. 작업일 2026-10-13~14.
- 원본 PNG 35장은 기존 `public/assets/coin-tower/`에 그대로 보존했다. Git 체크포인트의 원본과 SHA-256이 모두 같다. 옆의 `.webp`가 배포용 파생 파일이다.
- 설정은 `src/game/art-manifest.json`, 파일별 해시·원본/출력 크기·용량·픽셀 일치 기록은 `src/game/art-generated.json`이 기준이다. 기존 개별 아트 제작 문서의 PNG 사양·해시는 원본을 설명한다.
- PNG 26,430,860 bytes → WebP 13,355,598 bytes. 아이콘 8장은 7,574,848 → 448,922 bytes다. 기록 아이콘 3장은 384×384, 조작 아이콘 5장은 256×256으로 LANCZOS 축소했다.
- 나머지 27장은 기존 해상도를 유지한다. 모든 파일은 무손실 WebP로 저장했고 디코딩 결과가 준비한 픽셀과 바이트 단위로 같다. 축소하지 않은 27장은 원본 픽셀과도 같다. 원본의 알파와 frame 좌표를 유지하며 CSS의 비율 crop도 유지한다.
- WebP는 `lossless: true`, `quality: 100`, `method: 6`, `exact: true`로 인코딩했다. AI 재생성·재도색은 하지 않았다. 도구는 Python 3.13.14 / Pillow 12.3.0 / libwebp 1.6.0이다. 원본의 출처·이용 조건은 [자산 출처](../ASSET_SOURCES.md)를 따른다.

## 재생성·추가 작업

1. Python에 `scripts/art-requirements.txt`의 Pillow 버전을 준비한다. 설치가 필요한 환경에서는 `rtk proxy python3 -m pip install -r scripts/art-requirements.txt`를 사용한다. 일반 Node 빌드는 Pillow 없이 커밋된 WebP를 사용한다.
2. 원본 PNG를 추가/수정하고 `src/game/art-manifest.json`에 파일·필요한 최대 해상도·플랫폼 제한을 기록한다. 스킨/Phaser/HTML에서는 원본 이름을 사용하고 `artFile`/`artUrl`이 WebP 경로를 만든다.
3. `rtk npm run assets:optimize`로 파생 파일과 해시 기록을 갱신한다. 변경이 없는 파일은 해시·도구 버전을 확인해 재인코딩을 생략한다. 새 PNG를 등록하지 않았거나 무손실 디코딩이 다르면 실패한다.
4. 정적 검사·빌드 후 실제 장면을 관측한다. 해상도만 변경한 SHOP 256→320 설정이 생성 파일과 화면의 naturalWidth 320에 반영됨을 관측했고, 최종 값은 256으로 복원했다.
5. 원본·파생 파일·설정·해시 기록을 함께 기록한다. `dist/`는 생성 산출물이므로 Git에 넣지 않는다.

## 배포와 로딩

- `scripts/package-art.ts`는 이미지 원본/출력 해시·해상도 설정·인코딩 설정을 확인하고 등록한 WebP·`stack.wav`·`game-over.wav`·배포용 `arcade-sparkle.m4a`·favicon만 복사한다. 보존 음원 `source-audio/`는 업로드에 포함하지 않는다. `vite.config.ts`는 원본 public 디렉터리의 자동 복사를 끈다. 오래된 파생 이미지는 빌드 실패 후 재생성 안내를 표시한다.
- CrazyGames는 전체화면 아이콘 2개를 HTML src·필수 로더·업로드 파일에서 제외한다. standalone 빌드는 두 아이콘을 포함한다. 플랫폼 음소거·자체 전체화면 숨김·Gameplay Start 시점은 유지한다.
- CrazyGames 배포 전체가 20,000,000 bytes 이상이면 빌드를 실패시킨다. 이 검사는 전체 산출물 크기이며 실제 초기 전송량과는 다르다. HTML·Phaser의 중복 요청, 캐시·CDN 압축, 외부 SDK 크기가 실제 전송량에 영향을 준다.
- 업로드 대상은 **새 `dist/` 내부 전체**다. 원본 PNG가 있는 `public/`는 업로드하지 않는다. 이전 업로드의 오래된 PNG가 남지 않도록 포털의 새 빌드에 `index.html`, `favicon.svg`, `assets/` 구조로 올린다.
- 실제 관측 수치와 환경 한계는 [검증 기록](../VALIDATION.md)을 따른다. 최종 포털 Load size와 모바일 홈페이지 자격은 재업로드 후 확인해야 한다.

## 근거

- [CrazyGames 기술 기준](https://docs.crazygames.com/requirements/technical/): 초기 다운로드는 첫 Gameplay Start까지이며 모바일 홈페이지 기준은 20MB 이하다.
- [WebP 공식 안내](https://developers.google.com/speed/webp): 무손실·알파 지원.
- 설치된 Phaser 4.2.1 `ImageFile`은 HTMLImageElement로 디코딩한다. 설치된 Vite 8.3.2의 `build.copyPublicDir`·`writeBundle` 계약과 실제 개발/배포 Chromium으로 연결을 관측했다.
- 구조 결정은 [ADR 0006](../adr/0006-preserve-source-art-and-package-optimized-derivatives.md), 도구 버전과 라이선스는 [의존성](../DEPENDENCIES.md)을 따른다.
