# CrazyGames 프리뷰 영상

제작일: 2026-10-14. 사용자가 커버 제작 후 실제 플레이 프리뷰 영상 제작을 승인했다.

## 제출 파일

| 파일 (`marketing/crazygames/videos/`) | 해상도 | 길이 | 용량 |
| --- | --- | --- | --- |
| `coin-tower-landscape-1920x1080.mp4` | 1920×1080, 16:9 | 18초 | 8,065,466 bytes |
| `coin-tower-portrait-1080x1620.mp4` | 1080×1620, 2:3 | 18초 | 8,910,640 bytes |

공통: H.264 High / Level 4.2, yuv420p, 25fps, MP4 faststart, 오디오 스트림 없음. `marketing/`에만 보관하므로 게임 초기 다운로드에 추가되지 않는다.

2026-10-14 확인한 [CrazyGames 공식 영상 요구사항](https://docs.crazygames.com/requirements/game-covers/#video-requirements)을 기준으로 15~20초, 50MB 이하, 무음, 정상 속도, 커버 첫 프레임을 적용했다. 공식 세로 요구는 1080p·2:3으로 표기되어 있어 이번 파일은 가로 1080px의 1080×1620으로 제작했다. 실제 포털 업로드·변환·심사는 아직 확인하지 않았다.

## 화면 구성 및 출처

- 처음 0.12초(3프레임): [기존 커버](crazygames-covers.md). 세로 커버는 800×1200에서 확대했다.
- 이후 17.88초: 현재 게임의 연속 플레이. 금화 적층, Perfect 콤보, 5·10·15개 시간대 전환을 보여 준다. 금화 플레이에 집중하며 스킨 전환 컷은 넣지 않았다.
- 가로·세로 각각 해당 브라우저 크기로 따로 녹화했다. 실제 게임의 주변 흐림 배경을 포함하며 검정 여백·외부 홍보 문구·메뉴 화면을 삽입하지 않았다.
- 소스 체크포인트 `b3db7ae`. Playwright 1.63.0 / Chromium에서 로컬 Vite 개발 빌드를 녹화했다. 게임의 `?debug` 읽기 전용 snapshot으로 이동 위치를 관측하고 Space 키 이벤트를 자동 입력했다. freeze/advance나 점수·속도·재화·게임 규칙 변경은 사용하지 않았다. 사람이 수동 플레이한 기록이나 실기기 성능 측정은 아니다.
- 녹화 문서에만 `cursor:none`과 포커스 외곽선 숨김 CSS를 적용했다. 게임 소스는 변경하지 않았다. 개발 빌드라 자체 전체화면 아이콘이 보이며 CrazyGames 빌드는 해당 아이콘을 숨긴다.
- Playwright VP8 녹화에서 준비 구간을 잘라 정상 속도로 인코딩했다. FFmpeg 7.1 / libx264, `preset=medium`, `crf=18`, `-r 25`, `-an`, `-movflags +faststart`. 도구는 임시 Python 환경의 imageio-ffmpeg 0.6.0으로 준비했으며 프로젝트 의존성은 변경하지 않았다.
- 기존 게임 아트와 AI 생성 커버의 이용 조건을 따른다. 새 영상 생성 모델·외부 음원·제삼자 아트는 사용하지 않았다.

## 확인 결과

- 두 원본 녹화 모두 18개 / Perfect X17까지 진행, pageerror 없음.
- 최종 MP4 전체 FFmpeg 디코딩 오류 없음. 해상도, 18초, 25fps, 오디오 스트림 부재, 파일 크기 확인.
- 첫 프레임 커버, 가로 중간 Perfect, 세로 저녁 배경 및 녹화 마지막 밤 배경을 시각 확인했다.
- Chromium에서 각 파일을 처음부터 끝까지 재생한 결과는 [재생 기록](crazygames-preview-videos-playback.json), 파일 해시·인코딩 정보는 [메타데이터](crazygames-preview-videos-metadata.json)를 참고한다.
- 런타임 코드 변경이 없어 게임 회귀 테스트·재빌드는 실행하지 않았다. 업로드 후 CrazyGames에서 실제 미리보기의 크롭·재생을 확인하는 단계가 남아 있다.
