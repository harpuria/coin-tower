# Coin Tower 웹 아트 방향

## 시간대 배경

- [결정] 기존 아침 느낌의 배경을 보존하고, 적층 높이에 따라 시간의 흐름을 표현할 배경 변형을 준비한다. 2026-10-09 사용자 요청을 따른다.
- 제작한 변형: 점심의 맑은 파랑·중성 흰빛, 노을 진 저녁의 살구·주황·라벤더, 밤의 남색·푸른 달빛 느낌. 유적·폭포·배너의 큰 배치와 중앙의 빈 공간을 참조해 유지한다.
- 파일: `public/assets/coin-tower/backgrounds/sky_ruins_noon.png`, `sky_ruins_evening.png`, `sky_ruins_night.png`. 원본 `sky_ruins.png`는 수정하지 않았다.
- 테스트용 구간과 부드러운 전환 규칙은 [시간대 배경](design/backgrounds.md)을 따른다. 현재 런타임은 원본만 사용하며 새 배경은 자산 준비 상태다.
- 실제 출력 크기·세부 구도 차이·프롬프트·관찰 한계는 [제작 기록](art/background-time-of-day.md), 이용 조건은 [자산 출처](ASSET_SOURCES.md)를 따른다.

## Perfect 콤보 숫자

- [결정] 기존 `public/assets/coin-tower/perfect.png`를 유지하고 아래 줄에 X와 숫자 PNG를 조합해 `X1`, `X2`, …를 표시한다. 2026-10-08 사용자 요청을 따른다.
- 기준: 원본 Perfect의 둥글고 굵은 금색 글자, 밝은 윗면 하이라이트, 주황색 입체 측면, 짙은 적갈색 외곽선. 숫자는 기울이지 않고 같은 높이·기준선으로 정렬한다.
- 숫자마다 별·후광을 추가하지 않는다. 기존 Perfect 효과의 장식을 함께 사용한다.
- 파일: `public/assets/coin-tower/combo/x.png`, `0.png`~`9.png`. 투명 PNG, 공통 높이 192px, 글자 폭은 비례 유지. X는 대문자 모양이며 파일명만 소문자다.
- 게임 배치: Perfect 위 줄, 숫자 아래 줄. 자릿수가 늘면 가로 폭에 맞춰 축소하고 다음 이동 동전의 영역을 침범하지 않는다. 기존 피드백 시간에 함께 사라지며 정지·카운트다운 중 숨긴다.
- 생성·분리 과정과 출처는 [제작 기록](art/combo-glyphs.md), [자산 출처](ASSET_SOURCES.md)를 따른다. 사람의 가독성 평가는 자동 화면 검사와 구분한다.
