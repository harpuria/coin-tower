# Implementation Plan — First Coin Tower Web Playable

## Goal

[Decided] Deliver the first playable defined in [GAME_DESIGN.md](GAME_DESIGN.md), reusing the mobile art with mouse/touch input, completion-only local best, Perfect/combo, and pause/countdown behavior.

## Status

- Completed: first playable implemented and validated; original art, run rules, mouse/touch, persistence, and interruptions are connected.
- Current: this implementation effort is complete. Evidence is in `VALIDATION.md` and `PLAYTEST_NOTES.md`.
- Next proposed task: focused physical-device playtest of timing at 5/10/20 coins and Perfect readability; wait for the user's request.
- Blockers: none for the first playable. Physical-device feel and Safari/Firefox remain unverified; release services are deferred by design.

## Slices

- Completed slice 1: title → drop/stack → first miss → result/retry/home, original art, speed/camera, and completion-only best in a separate storage namespace.
- Completed slice 2: Perfect/combo, pause at every phase, background interruption, confirmation, and 3/2/1 resume with independent UI input.
- Completed slice 3: deterministic rules, native browser mouse/touch events, production checks, screenshots, asset provenance, and validation/playtest handoff.

## Implementation Entry Points

`src/game/rules.ts` owns tuning, `Session` owns deterministic run state, `GameController` connects common services, `CoinTowerScene` renders, and `Shell` owns HTML/input. Read `DEVELOPMENT.md` and ADR 0002 before changing ownership. Development-only observation is available at `/?debug`; production excludes it.

## Open Questions

Release targets and services remain as recorded in `SETUP.md`; they do not block this playable. No additional mechanics are proposed by this implementation.
