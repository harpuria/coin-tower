# Coin Tower Web setup

## Confirmed direction

- [Decided] Create a Phaser-based Web 2D casual game from the existing mobile Coin Tower.
- [Decided] Initialize a runnable project using the Phaser web template.
- [Decided] Retain the portrait composition; support desktop and mobile browsers using mouse and touch.
- [Decided] Initialize local Git; connect a remote later.

## Applied scaffold

- Source: https://github.com/harpuria/phaser-web-template
- Template version: 0.2.0; commit: `b953c81b31cfdb36f73c6462d707a45ec2b8a46d`; applied: 2026-10-07.
- Copied source/configuration, runtime demo assets, existing tests, CI, and documentation; excluded template Git history, generated artifacts, and the optional Claude Code import file.
- Phaser 4.2.1, TypeScript 6.0.3, Vite 8.3.2, npm lockfile, Node 24 recommendation. Installed Node: 24.16.0; npm: 11.13.0. Exact versions remain authoritative in package configuration.
- Project/package: Coin Tower / `coin-tower`, version 0.1.0. Logical viewport: 720×1280 with FIT scaling; portrait preference. Browsers without orientation locking still render the portrait viewport.
- The template's star collector remains as an explicitly labeled smoke-test demo. Menu/result placement, initial collection target, and browser checks were adapted for portrait dimensions. No Coin Tower gameplay or mobile save migration has been implemented.
- Demo persistence uses `coin-tower-web-demo` to keep future Coin Tower records separate. Ads, billing, analytics, and Mock services are disabled pending product decisions.
- Available tooling: Node/npm, pnpm, Git, GitHub CLI, template TypeScript/Vite tools and Playwright browser checks. No Phaser-specific MCP is required. Actual validation results belong in `VALIDATION.md`.
- Language defaults retained from the mobile project: Korean communication, player/design/art/audio documents, and explanatory comments; English agent instructions, implementation handoffs, ADRs, identifiers, and filenames.

## Legacy reference

The supplied path `~/Workspace/game/coin-tower-mobile` did not exist. The project was found at `~/Workspace/games/coin-tower-mobile` and was inspected read-only.

Consult its `docs/GAME_DESIGN.md`, `docs/GAME_CONCEPT.md`, `docs/ART_DIRECTION.md`, and `game/` when planning the port. Its Godot configuration uses a 720×1280 portrait viewport and mouse-emulated touch. Existing gameplay includes coin dropping/stacking, increasing speed, Perfect/combo feedback, pause/resume, local records, and achievements.

The legacy project's Android-only release and Google Play Games plan describe the mobile version. Web service decisions require a new scope. Legacy completion and device-validation records are not evidence that the web port is complete or verified.

## Remaining decisions

- [Decided] The initial port slice is defined in [GAME_DESIGN.md](GAME_DESIGN.md). It is ready for implementation; the current executable remains the template demo.
- [Open] Global ranking, identity, cloud storage, and a web-compatible backend/provider, if required.
- [Open] Hosting/distribution channel, offline/PWA requirements, minimum browser/device support, and FPS target.
- [Open] Ads, purchases, and analytics requirements; disabled in the scaffold.
- [Open] Remote repository and branch/push workflow; Git LFS remains deferred until needed.

The remaining decisions do not block the agreed initial port slice. Read `GAME_DESIGN.md` for its rules, scope, tuning hypotheses, and observable completion criteria before planning implementation.
