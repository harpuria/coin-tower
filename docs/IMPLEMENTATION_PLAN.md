# Implementation Plan — Coin Tower Record Presentation

## Goal

[Decided] Deliver the first playable defined in [GAME_DESIGN.md](GAME_DESIGN.md), reusing the mobile art with mouse/touch input, completion-only local best, Perfect/combo, and pause/countdown behavior.

[Decided] Prepare that playable for CrazyGames Basic Launch with HTML5 SDK v3 initialization, gameplay events, platform mute, English UI, and hidden custom fullscreen controls on CrazyGames.

[Decided] Display the full Perfect streak and save the completed run's longest streak independently from best height, following `design/records.md`.

[Decided] Present both records equally in results and the menu, with independent NEW BEST badges for strict improvements over the pre-completion personal best, following `design/records.md`.

## Status

- Completed: first playable implemented and validated; original art, run rules, mouse/touch, persistence, and interruptions are connected.
- Completed: CrazyGames Basic Launch preparation with SDK v3 initialization, gameplay events, platform mute, English controls/recovery/accessibility, and hidden custom fullscreen in the dedicated build.
- Completed: unlimited combo display and completion-only browser personal best combo storage. `Session` tracks current and maximum streak separately; the controller finalizes both personal bests once on failure; save schema v2 preserves v1 height/rounds and initializes the previously untracked combo best to zero.
- Current slice complete: result comparison rows and equal menu personal-best cards, with independent NEW BEST badges. The controller retains finalized run values, updated personal bests, and record-break flags computed before save updates; new runs and menu transitions clear the result snapshot. Ties receive no badge; combo values include x0 and x1. The save schema is unchanged.
- Validation: `check` passed (65 unit tests); standalone browser checks passed (24 development, 16 production with 8 development-only skips); CrazyGames checks passed (16 development and 16 production, each including 14 fixtures and 2 unmodified official SDK local checks). See `VALIDATION.md` for evidence and external limits.
- Next proposed task: decide global leaderboard periods, ties, and participation/identity rules in `design/records.md` before selecting and integrating a provider. CrazyGames Preview remains a separate external validation step.
- Scope: no advertising, accounts, cloud saves, global leaderboard, or portal publication. Physical-device tuning remains deferred at the user's request.
- Blockers: none for this completed slice. Portal acceptance, physical-device feel, and Safari/Firefox remain unverified. The latest `dist/` is the validated CrazyGames build; running `check`/`build` later replaces it with standalone output.

## Slices

- Completed slice 1: title → drop/stack → first miss → result/retry/home, original art, speed/camera, and completion-only best in a separate storage namespace.
- Completed slice 2: Perfect/combo, pause at every phase, background interruption, confirmation, and 3/2/1 resume with independent UI input.
- Completed slice 3: deterministic rules, native browser mouse/touch events, production checks, screenshots, asset provenance, and validation/playtest handoff.
- Completed slice 4: Basic Launch adapter and lifecycle connection, English controls/recovery/accessibility, dedicated build mode, and SDK boundary/browser validation.
- Completed slice 5: unlimited combo numbers with fixed effect intensity, run maximum retained through NICE/failure/pause, independent completion-only personal bests, v1 migration without data loss, and desktop/mobile browser and production regression evidence.
- Completed slice 6: equal result comparison rows and menu personal-best cards, independent strict-improvement badges, finalized maximum retained for results, and x0/x1/x100, ties, single/double record breaks, reset/reload, persistence regressions, and small portrait/portal layout validation.

## Implementation Entry Points

`src/game/rules.ts` owns tuning, `Session` owns deterministic run state, `GameController` connects common services, `CoinTowerScene` renders, and `Shell` owns HTML/input. Read `DEVELOPMENT.md` and ADR 0002 before changing ownership. Development-only observation is available at `/?debug`; production excludes it.

## Open Questions

CrazyGames is the confirmed release target. Combo record aggregation/finalization is resolved in `design/records.md`; global leaderboard presentation, ties, periods, identity, and service integration remain open. Portal Preview/acceptance and any later monetization/account/cloud scope remain separate from the completed Basic Launch integration.
