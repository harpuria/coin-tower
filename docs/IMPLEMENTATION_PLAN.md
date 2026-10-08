# Implementation Plan — CrazyGames Native Weekly Leaderboard

## Goal

[Decided] Use CrazyGames native leaderboards only, with one weekly best-height board and existing all-time browser height/combo records. Game rules are authoritative in [records.md](design/records.md); technical rationale is in [ADR 0004](adr/0004-crazygames-native-leaderboard.md). No external leaderboard or authentication backend is planned.

## Status

- Completed: first playable, original mobile art, mouse/touch, deterministic run simulation, interruptions, and completion-only local records.
- Completed: CrazyGames HTML5 SDK v3 initialization, gameplay events, platform mute, English UI, and hidden custom fullscreen controls in the dedicated build.
- Completed: unlimited Perfect combo, save schema v2 migration, independent browser bests, result/menu comparison and NEW BEST badges, gold X/0–9 feedback art. Retain current Perfect/X layout after PC feedback; physical-device tuning remains deferred.
- Design updated: the user adopted one native weekly height board, platform widgets/tie policy, and client SDK score submission. Browser personal bests remain all-time and independent. The former two all-time boards and external-provider implementation proposal are superseded.
- Current checkpoint: design/plan/ADR/document updates only; runtime account/leaderboard integration remains unimplemented. No upload, account access, or review submission was performed.
- User reports developer registration completed. Game entry/upload/Preview/review state and native leaderboard invitation are unknown; do not treat registration as leaderboard access.
- Next proposed task: prepare a CrazyGames upload package and inspect it in portal Preview. Leaderboard activation is an independent external gate; Basic Launch preparation can proceed without it.
- Current validation: document formatting, local link existence, and diff checks only. No gameplay tests or builds were run for this decision update.
- Previous runtime validation remains in [VALIDATION.md](VALIDATION.md): 65 unit tests, standalone 24 development/16 production checks, and CrazyGames production 16 checks (14 fixtures, 2 official SDK local). None proves portal authentication, leaderboard acceptance, or real-device behavior. Existing `dist/` remains the previously validated CrazyGames build.

## Slice 1 — Upload and Preview the Existing Playable

- **Dependencies:** developer registration, current portal form, prepared build/assets/metadata. User registration is reported; actual signed-in portal state has not been inspected.
- **Scope:** produce `build:crazygames` output, prepare an upload archive of the contents of `dist/`, and record build provenance. Start from the portal's `Submit a game` flow to upload and use Preview before final review submission. See [DEVELOPMENT.md](DEVELOPMENT.md).
- **Acceptance:** Preview loads original art with no missing paths; mouse/touch, gameplay events, platform mute/fullscreen, pause/resume and retry work. Record actual results and supported devices. Confirm whether a Leaderboard tab/configuration is available; if absent, ask CrazyGames about eligibility through portal/support rather than guessing an activation date.
- **Boundary:** submission for QA is distinct from uploading/previewing. No automatic publication or final review submission is authorized by the user's question about process. No claim of Basic/Full Launch acceptance or native leaderboard invitation.
- **Current limitation:** SDK/local fixtures have passed previously, but real Preview remains unverified. This planning task has not rebuilt or created an upload archive.

## Slice 2 — Native Account and Completed Score Submission

- **Dependencies:** native leaderboard invitation/activation and actual portal configuration; decisions for account changes, cooldown and retries. Runtime implementation needs a separate user request.
- **Files:** `src/services/crazygames.ts`, `platform.ts`, `src/app.ts`, `src/config/game.ts`, game-specific completion coordination in `src/game/controller.ts` or `records.ts`; optional state presentation in `src/ui/Shell.ts`. Read `ARCHITECTURE.md` first.
- **Direction:** extend the existing initialized SDK adapter. Check SDK account availability/current user and keep login optional. Encapsulate official AES-GCM score encoding plus `user.submitScore()` in the adapter; no direct SDK calls from game/UI. The browser uses the portal's client Encryption Key; do not add a server API key or build a JWT verification backend.
- **Configuration:** native score metric `POINTS`, sorting `DESC`, `isIncremental: false`. Set the 50-character guide to describe weekly best coin stacking. Numeric min/max and cooldown must be agreed and checked against real run cadence; platform limits must not silently add a gameplay combo cap. Preview must establish that lower/equal scores do not replace the season best.
- **Completion path:** finalize local results first, then attempt the current completed run's height. Do not gate submission on browser NEW BEST or submit historic local best. Preserve one completion attempt per run generation; restart/home/refresh before failure must not submit. Handle confirmed restart through `Session.confirm()` as well as controller `start()`.
- **Acceptance:** local best 80/current run 40 attempts 40; terminal failure attempts once; aborted runs never attempt; combo-only improvement adds no separate submission. Guest/unavailable/disabled states and failed local storage do not block play. A late async operation cannot send under another account or update a disposed app.
- **Observability:** distinguish SDK attempt/transport outcome from actual platform acceptance. The official client guide warns that responses are always successful; game UI must not infer ranked/accepted/weekly NEW BEST from that response. Verify reflected scores in portal/platform, not just console logs.
- **Exclude:** external services, server run tickets, replay verification, custom ranking queries/screens, cloud-save migration, ads and rewards. Client-side encryption does not make scores tamper-proof.

## Slice 3 — Portal Verification and Basic Launch Review

- **Dependencies:** slice 1; slice 2 only if native access is available. Lack of leaderboard invitation does not require delaying the existing personal-record playable.
- **Direction:** when runtime integration is requested, run `check`, desktop/mobile browser regressions, and CrazyGames fixtures; then build CrazyGames and run production checks as recorded in `DEVELOPMENT.md`. Update `DEPENDENCIES.md` with any new API/library compatibility evidence and `ARCHITECTURE.md` with actual service ownership.
- **Real-platform acceptance:** logged-in/guest play, account-unavailable hosts, optional login/cancel, account changes, leaderboard privacy restrictions, actual week-best preservation, tie display, cooldown, missing active season and season rollover. Verify all-time local bests survive rollover and result/menu NEW BEST stays local.
- **Evidence:** update `VALIDATION.md` with build, real Preview configuration and outcomes. Controlled SDK fixtures cannot prove rank acceptance. Full Launch eligibility, account/cloud-save requirements and monetization are separate later work.
- **Submission:** after Preview and metadata/cover review, the user can submit for initial QA. Official process is initial QA → Basic Launch → possible Full Launch; leaderboard availability remains invitation-based, not automatically granted at any of those steps.

## Open Operational Decisions

- Which account owns a run if login changes during play. [Proposed] use the start account, with guest login eligible from the next run; never transfer a pending score to a different user.
- What to do when submissions are too close together, fail, or cross a weekly boundary. [Proposed] bounded in-session retry for the original account/season only; do not replay an old season score into a new one. Confirm the available SDK signals before choosing an exact retry strategy.
- Platform allowed score range/cooldown and any inability to represent a legitimate long run. Keep technical limitations distinct from game rules.
- Cloud personal records remain deferred; using a weekly leaderboard does not synchronize browser bests/settings. Revisit applicable progress-save requirements before Full Launch.

## Next Request

`$game-implement CrazyGames 포털 Preview 업로드용 배포 ZIP을 준비하고 빌드·검증 결과와 업로드 방법을 정리해줘.` This is the next concrete artifact; the native integration can follow once actual access and remaining operational rules are known.
