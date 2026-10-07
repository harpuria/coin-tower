# ADR 0003 — CrazyGames Basic Launch integration

## Context

The user selected CrazyGames as the release target and requested HTML5 SDK v3 initialization, gameplay events, platform mute, English UI, and removal of the game's fullscreen control on that platform. Standalone development must remain usable without an external SDK.

## Decision

- Select CrazyGames with Vite's `crazygames` mode and dedicated run/build scripts. The normal mode remains standalone. Both modes use English UI, including accessibility, loading, storage, and recovery messages.
- `PlatformServices` owns a `CrazyGamesIntegration` adapter. Load the official v3 CDN script and await `SDK.init()` before constructing Phaser. Initialization has a ten-second deadline. Download/init/disabled-host failures show a reload screen and never claim readiness. Cancellation and late completion must not attach listeners or create a game after disposal.
- `GameController` reports transitions into actual play with `gameplayStart()` and manual pauses/results/menu transitions with `gameplayStop()`. Resume starts after the countdown, not when Continue is pressed. Background interruptions silently update the controller's tracking; focus/visibility events belong to the SDK. Explicit resume after returning reports a new start.
- Apply initial `game.settings.muteAudio` and settings-change callbacks to a separate forced-mute flag in `AudioService`. Effective mute is user mute OR platform mute OR suspension. Platform changes never overwrite persisted preferences. Disable the game's sound toggle while the platform forces mute.
- Hide and guard custom fullscreen controls for the entire CrazyGames build, including failure/loading states. The platform owns fullscreen.
- Keep the existing unavailable/Mock advertising, purchase, and analytics contracts separate. This integration does not enable those features. Saves remain browser-local with the existing schema.

## Alternatives

- Loading the SDK in every build adds network dependence to standalone use and complicates regression checks.
- Continuing as ready after failed initialization could silently omit required gameplay reporting.
- Sending gameplay stop/start on focus duplicates SDK behavior. Persisting forced mute would erase the user's own preference.
- Retaining a Korean localization selector adds UI and localization policy outside the requested English conversion; this slice uses English throughout.

## Consequences

Upload `dist/` only after `build:crazygames`; a normal build intentionally lacks SDK loading. SDK v3 is distributed through a moving major-version CDN URL, so dependency records include the URL, observation date, and validation method. Deterministic fixtures cover failures, event sequencing, and platform settings; an unmodified CDN script exercises real local mode. Neither proves CrazyGames Preview messaging or platform acceptance, which must be checked after upload.

References checked 2026-10-07: [SDK initialization](https://docs.crazygames.com/sdk/intro/), [game events and settings](https://docs.crazygames.com/sdk/game/), [gameplay requirements](https://docs.crazygames.com/requirements/gameplay/).
