# 두 순위표와 CrazyGames 인증 서비스 조사

- 확인일: **2026-10-08**. 공식 문서만 사용했다. 가격은 USD이며 세금·환율·추가 프로젝트·초과 사용량은 별도다. 실제 트래픽과 계정 권한은 확인하지 않았다.
- 규칙의 원본: [기록과 리더보드](../design/records.md). 이 문서는 서비스의 적합성과 기술 제안을 설명하며 확정된 게임 규칙을 변경하지 않는다.
- 상태: **[제안] Supabase Postgres + Edge Functions 권장**. 공급자 선택·결제·배포·인증 연결은 아직 수행하지 않았다. 실행 계획은 [Implementation Plan](../IMPLEMENTATION_PLAN.md)을 따른다.

## 결론과 비교

**[제안] 별도 Supabase Auth 로그인 없이 CrazyGames 토큰을 Edge Function에서 검증하고, Postgres에 두 개인 최고를 저장한다.** SQL로 공동 순위와 최초 기록 순서를 표현하고, 완료 요청의 중복 제거와 두 항목의 독립 갱신을 하나의 DB 작업으로 묶기 쉬운 점이 선택 이유다. 이는 아래 공식 기능을 프로젝트 요구에 적용한 판단이며 공급자의 전용 CrazyGames 연동 제품이라는 뜻은 아니다.

| 후보                                  | 요구 충족 방식                                                                 | 이 프로젝트에서의 판단                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Supabase Postgres + Edge Functions    | 외부 JWT를 함수에서 검증, 서버 전용 DB 쓰기, SQL 순위·트랜잭션                 | **1순위 제안**. 데이터 규칙이 명료하고 관리형 DB·백업 경로를 함께 갖출 수 있다. 운영 공개 시 Pro 예산 검토 |
| Cloudflare Workers + D1               | Worker에서 JWT 검증, D1 SQL과 원자 배치                                        | **비용 우선 대안**. 작은 서비스에 적합하지만 행 스캔 비용·DB 제한과 자체 API 운영을 관리해야 한다          |
| Firebase Auth + Functions + Firestore | 서버 JWT 검증 후 자체 인증 브리지 또는 서버 API, Firestore 트랜잭션·count 집계 | 가능. 기존 Firebase 운영 자산이 없는 현재는 인증 세션과 순위 집계 구성이 더 늘어난다                       |
| CrazyGames 자체 Leaderboards          | 초대제·게임당 하나·주간 초기화                                                 | 확정된 **두 전체 기간 순위표를 단독으로 충족하지 못함**                                                    |

CrazyGames 공식 기능은 초대된 게임만 사용할 수 있고 게임당 순위표 하나, 월요일 09:00 UTC 주간 초기화를 명시한다. 프로젝트의 초대 여부는 미확인이다. 따라서 Basic Launch 준비만으로 해당 기능을 사용할 수 있다고 가정하지 않으며, 두 전체 기간 순위표에는 별도 서비스가 필요하다는 판단이다. [CrazyGames Leaderboards](https://docs.crazygames.com/sdk/leaderboards/)

## CrazyGames 인증의 공통 조건

SDK v3는 계정 기능 사용 가능 여부를 `user.isUserAccountAvailable` 속성으로 제공한다. `getUser()`의 `__dangerousUserId`는 서버 인증 증거가 아니다. 서버 요청에는 `getUserToken()`의 JWT를 사용한다. 토큰은 1시간 만료이며 SDK가 갱신한다. 공식 예제는 공개키 JSON의 `publicKey`를 읽고 **RS256**으로 서명을 검증한다. 페이로드에는 `userId`, `gameId`, `username`, `profilePictureUrl`, `iat`, `exp`가 있다. 키는 변경될 수 있어 매번 조회하거나 캐시 후 검증 실패 시 재조회하도록 안내한다. [CrazyGames User v3](https://docs.crazygames.com/sdk/user/)

**[제안] 서버는 서명·만료·필수 필드 형식을 검증하고 `gameId`를 서버의 예상 게임 ID와 비교한다.** 브라우저가 보낸 별도 `userId`나 표시 이름으로 소유자를 정하지 않는다. 계정 키와 공개 표시 이름은 검증된 토큰에서 얻고 토큰 자체는 저장·로그에 남기지 않는다. 공식 예제에 없는 `aud`·`iss`를 임의로 필수화하지 않는다. 실제 Portal Preview 토큰과 키 교체 동작은 구현 단계에서 확인해야 한다. [토큰 검증 근거](https://docs.crazygames.com/sdk/user/)

로그인은 CrazyGames 인증 창을 이용하고 게임 시작을 로그인으로 막지 않는다. 외부 이메일·Google 로그인 화면을 따로 추가하는 방식은 이번 권장안에 필요하지 않다. 계정 API가 없는 환경은 게스트 플레이·공개 순위 열람을 유지하고 등록 불가 상태를 명확히 보여 주는 방향을 제안한다. [CrazyGames 계정 통합 요구](https://docs.crazygames.com/requirements/account-integration/)

## 후보 1: Supabase

### 인증과 저장 경계

Supabase Edge Functions는 서버에서 TypeScript를 실행할 수 있다. 기본 플랫폼 JWT 검사는 Supabase 사용자 토큰을 기대하므로 CrazyGames JWT를 그대로 Supabase Auth 토큰으로 취급하면 안 된다. 외부 서명을 직접 검사하는 함수는 해당 함수에만 `verify_jwt = false`를 설정하고 핸들러에서 검증하는 공식 패턴을 적용할 수 있다. **이 설정은 플랫폼 검사를 생략할 뿐 CrazyGames 인증을 해 주지 않으므로, 수동 검증 성공 전 DB 쓰기는 금지한다.** [Edge Functions](https://supabase.com/docs/guides/functions), [함수 인증](https://supabase.com/docs/guides/functions/auth), [함수별 설정](https://supabase.com/docs/guides/functions/function-configuration)

**[제안] 제출 함수는 검증한 CrazyGames 계정으로 서버 전용 DB 함수를 호출한다.** Supabase Auth 사용자·이메일·별도 브라우저 로그인 세션은 첫 버전에 만들지 않는다. secret/service role 자격 증명은 서버에서만 사용하며 브라우저의 `VITE_*` 설정에 넣지 않는다. 해당 권한은 RLS를 우회하므로 제출 함수의 검증과 DB 제약이 필수다. 브라우저에는 DB 직접 쓰기 권한을 부여하지 않는다. [API 키와 권한](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

완료 처리 RPC는 `public`·`anon`·`authenticated`의 실행 권한도 회수하고 필요한 서버 역할에만 허용한다. SQL 함수는 기본적으로 호출 가능할 수 있어 테이블 RLS만으로 제출 경로를 보호했다고 판단하지 않는다. `security definer`가 필요하면 고정 `search_path`와 명시적 스키마를 사용한다. [DB 함수 권한](https://supabase.com/docs/guides/database/functions)

### 두 순위표와 공동 순위

**[제안]** 계정별·항목별 최고 테이블에 `(account_id, metric)` 고유 제약을 두고, 새 값이 기존 값보다 큰 경우에만 `score`와 달성 순서를 함께 갱신한다. 동일·낮은 값은 두 필드를 모두 보존한다. 콤보 0은 행을 생성하지 않는다. 완료 `run_id`의 중복 방지와 두 기록 갱신은 같은 DB 트랜잭션으로 처리한다. Postgres는 충돌 시 조건부 갱신과 트랜잭션을 지원하므로 동시 제출을 브라우저의 사전 조회에 의존하지 않고 처리할 수 있다. [INSERT / ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html), [트랜잭션](https://www.postgresql.org/docs/current/tutorial-transactions.html)

순위 계산은 `RANK() OVER (PARTITION BY metric ORDER BY score DESC)`로 **1·1·3**을 얻고, 결과 행의 표시 순서에만 `score DESC, achievement_order ASC`를 적용한다. 달성 순서를 `RANK()`의 정렬에 넣으면 공동 순위가 깨진다. 페이지를 잘라 낸 후 그 페이지 안에서만 순위를 계산하지 않는다. 이 쿼리는 개념 설명이며 실제 스키마·인덱스·부하를 검증한 구현물이 아니다. [Postgres rank 의미](https://www.postgresql.org/docs/current/functions-window.html)

**[미결]** 최초 달성 순서가 클라이언트 플레이 시각인지 서버 접수 순서인지 아직 결정되지 않았다. **[제안]** DB가 부여하는 단조 증가 접수 순번을 동점 표시 기준으로 삼고 `achieved_at`은 운영·표시 정보로 남긴다. 트랜잭션 시작 시각을 반환하는 시간값만으로 접수 순서를 단정하지 않는다. 지연 제출이 있는 경우 실제 플레이 시각과 접수 순서가 다를 수 있음을 규칙에 명시해야 한다. 시간·순서 키는 엄격한 개인 최고 갱신 시에만 새로 부여한다.

### 운영과 비용

Free는 DB 500 MB, egress 5 GB, Edge Function 월 50만 호출을 포함한다. **1주 비활성 시 중지**되며 자동 백업은 포함하지 않는다. Pro는 **월 $25부터**이고 한 Micro 프로젝트에 해당하는 compute credit, DB 8 GB, egress 250 GB, 함수 월 200만 호출 및 일일 백업 7일 보관을 제공한다. 초과 함수는 100만 호출당 $2이며 compute 증설·추가 프로젝트 등은 별도다. [Supabase 요금](https://supabase.com/pricing)

함수 초과 사용량은 100만 회 패키지 단위로 올림 청구하며 실패 응답도 호출에 포함한다. Supabase의 preflight `OPTIONS` 요청은 함수 호출 과금에서 제외한다. [함수 호출 과금](https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations)

개발·인증 실험은 Free로 시작할 수 있다. **[제안] 공개 운영은 비활성 중지와 백업 요구를 검토해 Pro를 예산 기준으로 삼는다.** 무료로 항상 정상 운영될 것이라고 보장하지 않는다. 백업 보유와 복구 절차 검증은 별개이며 Free의 수동 내보내기 경로도 준비할 수 있다. [백업 문서](https://supabase.com/docs/guides/platform/backups)

## 후보 2: Cloudflare Workers + D1

**[제안]** Worker가 CrazyGames JWT를 검증한 후 바인딩으로 연결된 D1만 사용한다. 클라이언트는 Worker API만 호출하고 DB 관리 토큰은 받지 않는다. 이 역시 전용 CrazyGames 공급자 통합이 아니라 자체 인증 핸들러다. Workers는 Web Crypto를 제공하며 D1은 SQLite 엔진을 사용한다. [Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/), [D1 SQL](https://developers.cloudflare.com/d1/sql-api/sql-statements/)

SQLite `rank()`로 SQL 공동 순위를 표현할 수 있다. D1의 `batch()`는 준비된 SQL문을 순차 실행하며 실패 시 전체 배치를 중단·롤백하는 트랜잭션이다. **[제안]** 중복 완료 삽입과 조건부 개인 최고 갱신을 배치로 묶는다. JS의 `await` 사이에 읽고 쓰는 코드를 임의의 대화형 트랜잭션으로 간주하지 않는다. 실제 D1 쿼리·동시 제출·롤백은 구현 시 별도 검증한다. [SQLite rank](https://www.sqlite.org/windowfunctions.html), [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/)

Workers Free는 하루 10만 요청과 호출당 CPU 10 ms, Paid는 **월 $5부터**, 월 1천만 요청·CPU 3천만 ms를 포함한다. 초과는 요청 100만당 $0.30, CPU 100만 ms당 $0.02다. JWT 검증이 Free CPU 한도 안에 드는지는 실제 측정해야 한다. [Workers 요금](https://developers.cloudflare.com/workers/platform/pricing/)

D1 Free는 하루 읽기 500만 행·쓰기 10만 행·총 저장 5 GB다. Paid는 월 읽기 250억 행·쓰기 5천만 행과 저장 5 GB를 포함하고, 초과는 읽기 100만 행당 $0.001·쓰기 100만 행당 $1·저장 GB당 월 $0.75다. **반환한 행 수가 아니라 스캔한 행 수**가 중요하며 인덱스 갱신도 쓰기에 추가된다. Free 일일 한도 초과 시 쿼리가 실패한다. [D1 요금](https://developers.cloudflare.com/d1/platform/pricing/)

DB 하나의 최대 크기는 Free 500 MB·Paid 10 GB이고 한 DB는 쿼리를 한 번에 하나씩 처리한다. 따라서 전체 순위 쿼리를 매번 전량 실행하는 방식보다 Top 목록의 짧은 캐시와 개인 순위의 별도 조회가 필요할 수 있다. 낮은 고정비가 가장 중요한 조건이면 유력한 대안이며, 이 프로젝트에서는 SQL 운영 도구와 향후 확장 여유를 고려해 Supabase를 우선 제안한다. [D1 제한](https://developers.cloudflare.com/d1/platform/limits/)

D1에도 자동 Time Travel 복구가 있으며 Free는 지난 7일, Paid는 30일 범위를 제공한다. 해당 이력과 복구는 추가 비용이 없다고 명시한다. 복구가 현재 DB를 덮어쓰는 작업이라는 점을 포함해 실제 복구 절차를 연습해야 한다. [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)

## 후보 3: Firebase

### 인증과 순위 처리

Firebase는 서버 Admin SDK로 custom token을 만들고 클라이언트가 `signInWithCustomToken()`으로 로그인하는 공식 경로를 제공한다. **[제안]** CrazyGames JWT를 먼저 검증한 서버가 검증된 `userId`에 대응하는 Firebase UID로 custom token을 발급할 수 있다. CrazyGames JWT 자체를 Firebase custom token으로 전달하는 방식은 아니다. 이렇게 만든 Firebase 세션도 CrazyGames 현재 로그인 계정과 맞는지 관리해야 한다. [Custom token 인증](https://firebase.google.com/docs/auth/admin/create-custom-tokens)

인증 SDK가 필요하지 않다면 HTTPS Function이 매 요청의 CrazyGames JWT를 직접 검증하고 서버에서 Firestore에 쓰는 방식도 설계 가능하다. 이는 자체 API 제안으로, Firebase Auth 브리지와 동시에 둘 다 도입할 필요는 없다. 어느 경로든 브라우저의 점수 직접 쓰기는 막고 검증·소유권·중복 처리를 서버에서 수행해야 한다.

Firestore 트랜잭션은 현재 값을 읽고 더 큰 값만 갱신하며 두 항목과 중복 완료를 원자적으로 저장할 수 있다. 공동 순위는 **`1 + count(score > myScore)`**로 표현할 수 있고, 동점 표시 순서는 별도의 정렬·복합 인덱스로 유지한다. 이는 공식 atomic transaction과 aggregation 기능을 요구에 적용한 설계다. count는 스캔한 인덱스 양에 따라 비용과 지연이 증가하며 실시간 리스너·오프라인 집계를 지원하지 않는다. [트랜잭션](https://firebase.google.com/docs/firestore/manage-data/transactions), [집계 쿼리](https://firebase.google.com/docs/firestore/query-data/aggregation-queries)

공식 Firestore 리더보드 예제도 규모에 따라 단순 집계·주기적 저장·트리·근사 순위의 서로 다른 절충을 설명한다. 이번 요구의 정확한 공동 순위를 근사 순위로 바꾸는 것은 허용하지 않는다. 기존 Firebase 기반이 없는 현재에는 SQL 후보보다 집계·캐시 구조의 설계 부담이 크다는 판단이다. [공식 리더보드 Codelab](https://firebase.google.com/codelabs/build-leaderboards-with-firestore)

### 운영과 비용

Cloud Functions를 실제 배포하려면 **Blaze 청구 요금제**가 필요하다. Firebase 가격표는 함수 호출 월 200만 회 무료 범위와 초과 100만 회당 $0.40을 안내하지만 CPU·메모리·네트워크·빌드·저장소도 따로 고려해야 한다. 실행 세대·리전·설정에 따른 실제 Cloud 비용을 선택 단계에서 계산해야 하며 $0.40만으로 전체 비용을 계산하면 안 된다. [배포 조건](https://firebase.google.com/docs/functions/get-started), [Firebase 요금](https://firebase.google.com/pricing)

Firestore 무료 범위는 저장 1 GiB·일일 읽기 5만 문서·쓰기 2만 문서이며 집계는 최대 1천 인덱스 항목마다 읽기 1회로 청구되고 최소 1회가 적용된다. 예를 들어 개인 순위 하나를 계산할 때 더 높은 점수의 인덱스 항목 10만 개를 읽으면 그 집계는 약 100회 읽기로 산정된다. 리전별 단가·공개 목록의 문서 읽기·재시도·백업 비용도 별도다. [Firestore 과금](https://firebase.google.com/docs/firestore/pricing)

## 비용을 판단할 때의 가정

다음은 가격 보장이 아닌 **계산용 예시**다. 월 플레이 세션 1만 회, 로그인 완료 판 5만 회, 순위 화면 열기 2만 회, 화면당 두 목록을 한 요청으로 조회한다고 가정하면 제출 5만 + 조회 2만 = **7만 API 호출/월**이다. 로그인 토큰 교환·사전 run 발급·OPTIONS·재시도·키 조회·봇 트래픽·운영 작업은 제외했다.

[구현 계획](../IMPLEMENTATION_PLAN.md)의 서버 run 발급안을 적용하면 완료 판의 시작 요청만 추가해도 **최소 12만 호출/월**이다. 로그인 상태에서 시작한 뒤 중단한 판도 run 발급을 사용하므로 실제 시작 요청은 5만 회보다 많을 수 있다. 아래 비교의 7만 호출은 제출·조회만 센 하한 예시이며 최종 예산에는 시작 요청을 포함한다.

- Supabase: 예시 호출량은 함수 포함량보다 작지만 DB·egress·추가 호출을 별도 측정한다. Pro 기본 구성을 선택하면 월 $25부터라는 예산 기준은 여전히 남는다.
- Cloudflare: 예시 요청량은 Paid 포함량보다 작지만 CPU 및 D1 행 읽기·쓰기 수가 다른 과금 축이다. 월 $5만으로 고정된다고 단정하지 않는다.
- Firebase: 예시 함수 호출량만으로 비용을 결정할 수 없다. 두 목록 각 50행을 매 조회마다 읽으면 캐시가 없을 때 **월 200만 문서 읽기**가 생기며, 개인 순위 count와 쓰기는 추가다. 일별 트래픽 분포에 따라 무료 범위 적용도 달라진다.

**[제안]** 첫 구현은 순위 화면을 열 때 조회하고 짧은 공개 Top 캐시를 사용한다. 매 동전 착지마다 전송하거나 전역 실시간 리스너를 유지하지 않는다. 실제 화면 요구·트래픽 관측 후 조회 범위와 캐시 시간을 정한다.

## 인증으로 해결되지 않는 부분

CrazyGames 서명 토큰은 **누가 제출했는지**를 확인한다. 완료 판의 실제 점수가 맞다는 증거는 아니다. CrazyGames 자체 클라이언트 제출 경고와 Firebase 리더보드 예제도 브라우저 점수 조작 및 별도 게임 검증 필요성을 설명한다. [CrazyGames 제출 방식](https://docs.crazygames.com/sdk/leaderboards/), [Firebase 검증 한계](https://firebase.google.com/codelabs/build-leaderboards-with-firestore)

**[제안] 기본 서버 검사**는 서버 발급 run·안전한 정수·범위·`maxCombo <= max(0, coins - 1)`·규칙 버전·완료 run 식별자 중복·요청 빈도·계정 소유권을 포함한다. 하지만 클라이언트가 보낸 `completed: true`나 가능한 범위의 점수만으로 실제 첫 실패 완료를 증명하지는 못한다. 경쟁 신뢰도를 높이려면 입력 재생 검증을 별도 단계로 설계할 수 있다. 이 방식도 자동 플레이를 완전히 막지는 못하며 검증 수준은 사용자 결정이 필요하다.

## 구현 전에 남은 결정

1. **공급자·운영 예산**: Supabase 권장안을 채택할지, 더 낮은 고정비의 Workers+D1을 선택할지.
2. **달성 순서**: 서버 최초 접수를 기준으로 할지, 지연·오프라인 제출을 어떻게 취급할지.
3. **계정 전환과 기존 기록**: 판 시작 계정 고정·게스트 과거 기록 미이전·판 도중 로그인 정책.
4. **검증 수준**: 서버 run 발급·형식·중복·범위 검사로 시작할지, 입력 재생 검증까지 첫 공개 전에 포함할지.
5. **화면·재시도·운영**: 공개 표시 정보, 조회 범위, 오류 안내, 보관 기간·계정 삭제·부정 기록 삭제/복구 절차.

세 외부 백엔드 후보는 모두 두 순위표를 만들 수 있다. 현재 추천의 핵심은 **CrazyGames 계정을 서버에서 직접 검증하고 SQL로 독립 최고·공동 순위·원자 갱신을 함께 다루는 구조**다. 실제 Portal 인증·배포 서비스·부하·기록 무결성은 문서 조사로 검증되지 않았다.
