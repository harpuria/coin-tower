# Implementation Plan — CrazyGames Native Weekly Leaderboard

## Goal

[Decided] Use CrazyGames native leaderboards only, with one weekly best-height board and existing all-time browser height/combo records. Game rules are authoritative in [records.md](design/records.md); technical rationale is in [ADR 0004](adr/0004-crazygames-native-leaderboard.md). No external leaderboard or authentication backend is planned.

## Status

- Feedback assessment (2026-10-10): user reports an unfair-looking failure despite substantial coin overlap. Current center-distance rule explains the case; exact run coordinates/build are unknown. Wider normal-success tolerance is proposed in [playtest notes](PLAYTEST_NOTES.md). No gameplay value, test or build changed; proposal acceptance and comparative play remain pending.

- Completed: first playable, original mobile art, mouse/touch, deterministic run simulation, interruptions, and completion-only local records.
- Completed: CrazyGames HTML5 SDK v3 initialization, gameplay events, platform mute, English UI, and hidden custom fullscreen controls in the dedicated build.
- Completed: unlimited Perfect combo, save schema v2 migration, independent browser bests, result/menu comparison and NEW BEST badges, gold X/0–9 feedback art. Retain current Perfect/X layout after PC feedback; physical-device tuning remains deferred.
- Completed implementation (2026-10-09): Space starts from the menu without clicking the game area and drops during play; held keys and native button controls do not duplicate game input. PLAY/TRY AGAIN/CONTINUE restore game-area focus. Static checks/build and remaining runtime verification are recorded in `VALIDATION.md`.
- Completed and browser-observed (2026-10-09): repeating time-of-day backgrounds and crossfade per [background design](design/backgrounds.md). Session owns transition time and freeze/reset behavior; Scene composites two preloaded images. Four focused desktop/mobile Chromium checks cover milestones, transition opacity, pause/countdown, restart/home, failure retention and live RAF completion. Human feel and physical devices remain unverified; see [observations](PLAYTEST_NOTES.md).
- Design updated: the user adopted one native weekly height board, platform widgets/tie policy, and client SDK score submission. Browser personal bests remain all-time and independent. The former two all-time boards and external-provider implementation proposal are superseded.
- Current checkpoint: Space input and background transitions are implemented; current CrazyGames `dist/` includes both. The archived ZIP from source `d1bd050` / version 0.1.0 predates both changes. Runtime account/leaderboard integration remains unimplemented. No upload, account access, or review submission was performed.
- User reports developer registration completed. Game entry/upload/Preview/review state and native leaderboard invitation are unknown; do not treat registration as leaderboard access.
- Next: upload the current CrazyGames `dist/` contents and inspect portal Preview. The user reports ZIP upload is unsupported; the old ZIP predates the Space change. Leaderboard activation is an independent external gate; Basic Launch preparation can proceed without it.
- Current validation: `check` passed including 65 unit tests, typecheck and standalone build; CrazyGames build also passed. Focused background E2E passed 4/4 (desktop/mobile), with actual mouse/Space/touch actions and inspected screenshots. Production excludes the development renderer query. Full standalone E2E was not rerun; detailed Space edge cases, portal focus and physical-device feel remain outside this focused observation. See [VALIDATION.md](VALIDATION.md).
- Current production regression: CrazyGames E2E passed 16/16 (14 fixtures, 2 official SDK local) on the current build. Asset readiness, SDK lifecycle, mute, English controls, fullscreen hiding and small viewports remain covered. The official SDK file hash is unchanged from `DEPENDENCIES.md`; no real portal Preview was performed.
- Previous full standalone runtime validation remains in [VALIDATION.md](VALIDATION.md): 24 development/16 production checks. Those full-suite results predate Space/background implementation; current focused observations above are separate. Portal authentication, leaderboard acceptance, and real-device behavior remain unverified.

## Slice 1 — Upload and Preview the Existing Playable

- **Dependencies:** developer registration, current portal form, prepared build/assets/metadata. User registration is reported; actual signed-in portal state has not been inspected.
- **Scope:** produce `build:crazygames` output, prepare an upload archive of the contents of `dist/`, and record build provenance. Start from the portal's `Submit a game` flow to upload and use Preview before final review submission. See [DEVELOPMENT.md](DEVELOPMENT.md).
- **Acceptance:** Preview loads original art with no missing paths; mouse/touch, gameplay events, platform mute/fullscreen, pause/resume and retry work. Record actual results and supported devices. Confirm whether a Leaderboard tab/configuration is available; if absent, ask CrazyGames about eligibility through portal/support rather than guessing an activation date.
- **Boundary:** submission for QA is distinct from uploading/previewing. No automatic publication or final review submission is authorized by the user's question about process. No claim of Basic/Full Launch acceptance or native leaderboard invitation.
- **Current result:** the previous upload archive was prepared, but the user reports the portal requires files/folders. Use the newly built `dist/` contents for the Space-input version; the archived ZIP is historical. Real Preview and all portal-specific acceptance conditions remain unverified, so slice 1 is only locally prepared.

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

If the user adopts the proposed wider normal-success tolerance, implement that tuning and verify both boundaries and visible partial-overlap cases. Example follow-up: `$game-implement 일반 성공 허용 범위를 동전 폭의 45%로 넓히고 Perfect는 유지해서 브라우저에서 검증해줘.` PC feedback on background fade feel remains outstanding. Current CrazyGames `dist/` is unchanged by this assessment and remains available for portal Preview; native integration depends on actual access and operational decisions. Final review submission remains a separate action.
