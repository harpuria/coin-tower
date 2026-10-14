# CrazyGames 커버 3종

제작일: 2026-10-14. 사용자 요청: 기존 아트로 Landscape·Portrait·Square 커버 제작.

## 업로드 파일

| 용도      | 파일                                                                        | 실제 크기 | 용량            |
| --------- | --------------------------------------------------------------------------- | --------- | --------------- |
| Landscape | [PNG](../../marketing/crazygames/covers/coin-tower-landscape-1920x1080.png) | 1920×1080 | 2,889,107 bytes |
| Portrait  | [PNG](../../marketing/crazygames/covers/coin-tower-portrait-800x1200.png)   | 800×1200  | 1,569,026 bytes |
| Square    | [PNG](../../marketing/crazygames/covers/coin-tower-square-800x800.png)      | 800×800   | 1,085,402 bytes |

모두 불투명 RGB PNG다. 포털 Cover image의 해당 칸에 개별 업로드한다. 게임 런타임 파일이 아니므로 `public/`·`dist/`에는 넣지 않았다.

## 구성과 제작

- 참조: 기존 `public/assets/coin-tower/`의 `logo.png`, `coin.png`, `pedestal.png`, `sky_ruins.png`. 원본은 변경하지 않았다.
- 기존 아트를 참조한 AI 재구성이며 원본 픽셀을 그대로 붙여 넣은 합성본은 아니다. 금색 COIN·흰 TOWER·파란 외곽선·왕관, 왕관 금화, 금띠와 덩굴이 있는 석재 받침대, 파란 하늘 유적·폭포의 표현을 유지했다.
- 가로형은 왼쪽 큰 로고·오른쪽 높은 탑, 세로형은 위 로고·아래 긴 탑, 정사각형은 큰 로고·짧고 굵은 탑이다. 낙하 중인 동전 한 개와 접점 반짝임을 공통으로 사용했다. 탑의 높이와 받침대 하단 크롭은 비율별로 다르다.
- OpenAI 내장 `image_gen.imagegen`으로 비율별 한 번씩 총 3회 생성했다. 세로·정사각형은 완성된 가로형도 추가 참조했다. 정확한 모델 버전·seed는 도구에 노출되지 않았다. `transparent_background: false`다.
- 도구 출력은 각각 1672×941, 1024×1536, 1254×1254였다. macOS `sips --resampleHeightWidth`로 지정 납품 크기에 맞춰 PNG로 내보냈다. 가로형은 약 1.15배 확대이며 나머지는 축소다. 추가 글자·재도색·영역 삭제는 없고 생성 원본은 도구 저장 위치에 보존했다.
- 전체 프롬프트·참조·원본 경로는 [프롬프트 기록](crazygames-covers-prompts.json), 원본/납품 SHA-256·크기·바이트는 [메타데이터](crazygames-covers-metadata.json)에 있다.

## 확인과 한계

- 원본 네 장·생성본·최종 PNG 세 장을 직접 열어 비교했다. 제목 철자 COIN TOWER와 왕관·금화·배경 색감, 제목/낙하 동전의 비잘림을 확인했다. HUD·버튼·추가 문구·테두리·스토어 로고는 넣지 않았다.
- 세 PNG의 실제 디코딩, RGB 형식, 지정 픽셀 크기와 해시를 확인했다. 기존 아트 네 파일의 해시는 [자산 출처](../ASSET_SOURCES.md)의 원본 기록과 같다.
- 제출용 정지 이미지 제작이므로 게임 코드·배포 빌드는 바꾸지 않았다. 게임 플레이 검사나 영상 녹화는 이번 작업에 포함하지 않았다. 실제 CrazyGames 업로드/승인·썸네일 클릭률은 미확인이다.
- 기준: [CrazyGames Game covers](https://docs.crazygames.com/requirements/game-covers/)의 세 비율, 제목 외 문구·테두리·아이콘/스토어 로고 금지 안내를 반영했다. 최종 포털 심사를 보증하지 않는다.
- 이용 조건 확인(2026-10-14): [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/) Content 절은 법이 허용하는 범위에서 사용자에게 Output 권리를 귀속한다. 입력 참조 권리와 실제 계정의 계약 조건은 계속 적용되며 독점성은 보장되지 않는다. 기존 모바일 아트의 재사용 근거는 사용자 요청이다. 실제 계정 계약 유형은 확인하지 않았다.

## 다음 작업

이 커버를 각 영상의 첫 프레임으로 사용해 실제 플레이 기반의 가로·세로 프리뷰를 준비한다. 예: `$game-assets-gen 이 커버를 첫 프레임으로 사용해 실제 플레이 기반 CrazyGames 가로·세로 프리뷰 영상을 만들어줘.` 영상은 별도 요청 후 진행한다.
