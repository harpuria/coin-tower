# 새 게임에 적용하기

템플릿 버전: 0.2.0 · 저장소: https://github.com/harpuria/phaser-web-template

## 새 프로젝트 만들기

다음 중 하나로 git 이력 없이 파일만 가져옵니다.

```bash
# 저장소가 GitHub 템플릿으로 설정되어 있으면: 웹에서 "Use this template"
npx degit harpuria/phaser-web-template my-game   # 공개 저장소일 때
git clone --depth 1 https://github.com/harpuria/phaser-web-template my-game && rm -rf my-game/.git
```

이어서 아래 순서로 진행합니다.

1. `npm ci` → `npm run dev`로 데모가 실행되는지 확인합니다.
2. [교체 체크리스트](../DEVELOPMENT.md#데모를-내-게임으로-바꾸기)에 따라 이름·저장 키·장면·asset·UI를 바꿉니다.
3. `npm run check` → 게임에 맞춘 E2E를 실행합니다.
4. 게임 문서에 템플릿 저장소 URL, 템플릿 버전, 가져온 commit hash, 적용 날짜를 기록합니다.

기존 프로젝트에 병합할 때는 같은 이름의 파일을 덮어쓰지 말고 필요한 `core/`·`services/` 기능만 가져옵니다.

## 템플릿 업데이트 가져오기

1. 기록해 둔 commit과 최신 템플릿 사이의 diff에서 `core/`, `services/`, `scenes/`, 관련 검사만 검토합니다.
2. 게임의 `config/`, `game/`(schema·규칙), UI는 보존합니다.
3. 저장 schema에 영향이 있으면 migration 검사를 추가하고, 기록한 템플릿 버전·commit을 갱신합니다.

`docs/template/`는 템플릿 자체의 이력입니다. 파생 게임의 기획·검증 기록은 게임 문서에 따로 둡니다.
