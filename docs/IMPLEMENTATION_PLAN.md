# Implementation Plan — Coin Tower CrazyGames Basic Launch

## Goal

[Decided] Deliver the first playable defined in [GAME_DESIGN.md](GAME_DESIGN.md), reusing the mobile art with mouse/touch input, completion-only local best, Perfect/combo, and pause/countdown behavior.

[Decided] Prepare that playable for CrazyGames Basic Launch with HTML5 SDK v3 initialization, gameplay events, platform mute, English UI, and hidden custom fullscreen controls on CrazyGames.

## Status

- Completed: first playable implemented and validated; original art, run rules, mouse/touch, persistence, and interruptions are connected.
- Current: CrazyGames Basic Launch preparation is implemented and locally validated: SDK v3 initialization, gameplay events, platform mute, English UI, and hidden custom fullscreen controls in a dedicated CrazyGames build. See `VALIDATION.md` for results and external limits.
- Scope: Basic Launch preparation only; advertising, accounts, cloud saves, and portal publication are not included. Physical-device tuning is deferred at the user's request.
- Validation: SDK boundary unit tests, deterministic SDK fixtures in desktop/mobile browsers, standalone regression, production builds, and an unmodified official CDN SDK in local mode passed. CrazyGames Preview remains an external verification step.
- Current design workshop: unlimited Perfect combo display and leaderboard categories for best height and Perfect combo are confirmed. The user chose completion-only records: Perfect combo means the longest consecutive streak within one run, finalized only at the first failure. These changes are not implemented yet. Read `GAME_DESIGN.md` and `design/records.md` before changing combo or persistence behavior.
- Next proposed task: implement unlimited combo display and completion-only personal best combo storage with the accepted interruption rules. Global leaderboard UI/service decisions and portal Preview remain separate steps.
- Blockers: none for implementation. Portal acceptance, physical-device feel, and Safari/Firefox remain unverified.

## Slices

- Completed slice 1: title → drop/stack → first miss → result/retry/home, original art, speed/camera, and completion-only best in a separate storage namespace.
- Completed slice 2: Perfect/combo, pause at every phase, background interruption, confirmation, and 3/2/1 resume with independent UI input.
- Completed slice 3: deterministic rules, native browser mouse/touch events, production checks, screenshots, asset provenance, and validation/playtest handoff.
- Completed slice 4: Basic Launch adapter and lifecycle connection, English controls/recovery/accessibility, dedicated build mode, and SDK boundary/browser validation.

## Implementation Entry Points

`src/game/rules.ts` owns tuning, `Session` owns deterministic run state, `GameController` connects common services, `CoinTowerScene` renders, and `Shell` owns HTML/input. Read `DEVELOPMENT.md` and ADR 0002 before changing ownership. Development-only observation is available at `/?debug`; production excludes it.

## Open Questions

CrazyGames is the confirmed release target. Combo record aggregation/finalization is resolved in `design/records.md`; global leaderboard presentation, ties, periods, identity, and service integration remain open. Portal Preview/acceptance and any later monetization/account/cloud scope remain separate from the completed Basic Launch integration.
