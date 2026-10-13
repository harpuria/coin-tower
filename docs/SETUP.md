# Coin Tower Web setup

## Confirmed direction

- [Decided] Create a Phaser-based Web 2D casual game from the existing mobile Coin Tower.
- [Decided] Initialize a runnable project using the Phaser web template.
- [Decided] Retain the portrait composition; support desktop and mobile browsers using mouse and touch.
- [Decided] Initialize local Git; connect a remote later.
- [Decided] Target CrazyGames Basic Launch; integrate HTML5 SDK v3 initialization, gameplay events, and platform mute. Use English game UI and hide the game's fullscreen button in the CrazyGames build. Physical-device tuning is deferred for now.

## Applied scaffold

- Source: https://github.com/harpuria/phaser-web-template
- Template version: 0.2.0; commit: `b953c81b31cfdb36f73c6462d707a45ec2b8a46d`; applied: 2026-10-07.
- Copied source/configuration, runtime demo assets, existing tests, CI, and documentation; excluded template Git history, generated artifacts, and the optional Claude Code import file.
- Phaser 4.2.1, TypeScript 6.0.3, Vite 8.3.2, npm lockfile, Node 24 recommendation. Installed Node: 24.16.0; npm: 11.13.0. Exact versions remain authoritative in package configuration.
- Project/package: Coin Tower / `coin-tower`, version 0.1.0. Logical viewport: 720×1280 with FIT scaling; portrait preference. Browsers without orientation locking still render the portrait viewport.
- The initial scaffold demo has been replaced by the agreed Coin Tower first playable. Original mobile PNGs, deterministic run simulation, completion-only local best, feedback, pause/countdown, and mouse/touch controls are implemented. See `GAME_DESIGN.md` for rules and `IMPLEMENTATION_PLAN.md` for current validation status.
- Game persistence uses `coin-tower-web-v1`, separate from the scaffold's `coin-tower-web-demo` and mobile saves. Ads, billing, analytics, and Mock services remain disabled pending product decisions.
- Available tooling: Node/npm, pnpm, Git, GitHub CLI, template TypeScript/Vite tools and Playwright browser checks. No Phaser-specific MCP is required. Actual validation results belong in `VALIDATION.md`.
- Document/comment language defaults retained from the mobile project: Korean communication, player/design/art/audio documents, and explanatory comments; English agent instructions, implementation handoffs, ADRs, identifiers, and filenames. The user requested English game UI for CrazyGames preparation.

## Legacy reference

The supplied path `~/Workspace/game/coin-tower-mobile` did not exist. The project was found at `~/Workspace/games/coin-tower-mobile` and was inspected read-only.

Consult its `docs/GAME_DESIGN.md`, `docs/GAME_CONCEPT.md`, `docs/ART_DIRECTION.md`, and `game/` when planning the port. Its Godot configuration uses a 720×1280 portrait viewport and mouse-emulated touch. Existing gameplay includes coin dropping/stacking, increasing speed, Perfect/combo feedback, pause/resume, local records, and achievements.

The legacy project's Android-only release and Google Play Games plan describe the mobile version. Web service decisions require a new scope. Legacy completion and device-validation records are not evidence that the web port is complete or verified.

## Remaining decisions

- [Decided] The initial port slice is defined in [GAME_DESIGN.md](GAME_DESIGN.md) and implemented. Device feel and release targets remain separate from the local/browser validation recorded in `VALIDATION.md`.
- [Decided] Browser personal records remain all-time best height and longest Perfect combo from completed runs. Unlimited combo display, equal result/menu records, and independent NEW BEST badges are implemented. Star Shard collection and skin ownership/equip now share save schema v4. Sequential migrations preserve v1/v2 records with zero initial shards, and v3 records/balance with gold initially owned/equipped. See `design/records.md`, `design/economy.md` and `DEVELOPMENT.md`.
- [Decided] Use CrazyGames native leaderboards only: one weekly best-height board, non-incremental descending scores, platform tie policy and widgets, client SDK submissions. No external leaderboard/authentication backend in this scope. See [ADR 0004](adr/0004-crazygames-native-leaderboard.md).
- [Open] Portal upload/Preview and native leaderboard invitation/activation are unverified. Account transitions, submission cooldown/retry across season boundaries, and cloud personal-record storage still require decisions. [Implementation plan](IMPLEMENTATION_PLAN.md) covers the current path. [External provider research](research/leaderboard-services.md) is a superseded-scope reference.
- [Decided] Distribution target: CrazyGames. Dedicated `dev:crazygames` / `build:crazygames` select the SDK integration; normal development/build remains standalone. See ADR 0003 and `DEVELOPMENT.md`.
- [Open] Offline/PWA requirements, minimum browser/device support, and FPS target.
- [Open] Ads, purchases, and analytics requirements; disabled in the scaffold.
- [Open] Remote repository and branch/push workflow; Git LFS remains deferred until needed.

The remaining decisions do not block the agreed initial port slice. Read `GAME_DESIGN.md` for its rules, scope, tuning hypotheses, and observable completion criteria before planning implementation.
