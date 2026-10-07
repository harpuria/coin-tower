# 0002 — Deterministic run and latched interruptions

Status: [Decided] gameplay and interruption behavior in `GAME_DESIGN.md`; implementation decision documented here.

## Context

The game must stop movement, landing, feedback, camera, and audio while a three-second resume countdown and HTML controls remain responsive. Whole-scene pause would also stop the countdown. Boundary rules and completion-only persistence need repeatable validation independent of browser rendering.

## Decision

`Session` owns deterministic run simulation. `GameController` connects player actions, completion-only persistence, audio, and interruption policy. `CoinTowerScene` renders the model; HTML `Shell` owns accessible controls and native primary pointer input. `App` remains the common-service composition owner and exposes a background callback.

Keep `pausableScenes` empty for this game. The scene continues rendering, while the run model freezes movement and feedback. Existing `PauseState` suspends audio for run/environment reasons. Hidden/blur events latch the run paused; restoring focus never starts the run. Explicit continue starts a fresh countdown.

A development-only `?debug` hook can freeze automatic simulation, inspect state, and advance time for real-input browser checks. Production removes this hook.

## Alternatives

- Pause the entire scene and run a separate countdown scene: valid, but introduces another clock and ownership boundary for this small game.
- Keep gameplay rules in scene callbacks: reduces initial files but couples deterministic rules to rendering and browser timing.

## Consequences

Scene updates must not advance the simulation while paused; all future gameplay timers belong to the run model or obey its freeze state. Native DOM pointer events provide one primary press without processing emulated mouse events twice. Save writes occur only on the model's one-shot finished event. Debug time control is excluded from production behavior.
