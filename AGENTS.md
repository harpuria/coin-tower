# Coin Tower Web

- [Decided] Build a 2D casual web game with Phaser, retaining the portrait layout and supporting desktop/mobile browsers with mouse/touch input.
- Scaffold defaults: Phaser/TypeScript/Vite versions are pinned in `package.json` and `package-lock.json`; use Node 24 (`.nvmrc`). Configuration lives in `src/config/game.ts` (720×1280, FIT).
- The playable is Coin Tower's agreed first web slice with original mobile art and English UI. [Decided] Prepare CrazyGames Basic Launch with HTML5 SDK v3; see ADR 0003. Ads, billing, and analytics remain disabled. Read `docs/SETUP.md` for provenance and deferred scope, and `docs/ASSET_SOURCES.md` when importing/replacing art or audio.

## Start here

1. This file, then `docs/SETUP.md` for setup facts and migration context.
2. `docs/IMPLEMENTATION_PLAN.md` Status, then `docs/GAME_DESIGN.md` for gameplay work and `docs/DEVELOPMENT.md` for implementation entry points.
3. Read `docs/ARCHITECTURE.md` before changing `core/`, `services/`, `app.ts`, lifecycle, persistence, or service contracts.
4. Recent commits, task-relevant system documents, and the latest relevant `docs/PLAYTEST_NOTES.md` entry.

## Commands

Prefix all shell commands with `rtk`, including each segment in chains. `rtk proxy <command>` preserves raw output; raw commands are allowed for debugging.

- Install: `rtk proxy npm ci`.
- Regenerate optimized art after source/settings changes: `rtk npm run assets:optimize` (Python/Pillow setup and packaging contract: `docs/art/optimized-assets.md`). Preserve source PNGs; upload only the built `dist/` contents.
- Run: `rtk npm run dev` → `http://localhost:5173` (LAN access for mobile browsers).
- CrazyGames run/build: `rtk npm run dev:crazygames` / `rtk npm run build:crazygames`. SDK browser checks: `rtk npm run test:crazygames`; after that build, `rtk proxy env E2E_PREVIEW=1 npm run test:crazygames`. See `docs/DEVELOPMENT.md` for real SDK versus fixture coverage.
- Static checks and production build: `rtk npm run check` (lint, format, unit tests, typecheck, build).
- Browser checks and screenshots: `rtk npm run test:e2e` (desktop/mobile Chromium; artifacts in `test-results/`).
- Focused 5/10/20 touch playtest: `rtk npm run playtest:touch`; read the method and limits in `docs/DEVELOPMENT.md` before interpreting timings or screenshots.
- Production preview: `rtk npm run preview` → `http://localhost:4173`.
- Production browser checks, after build: `rtk proxy env E2E_PREVIEW=1 npm run test:e2e`.
- Development observation: open `http://localhost:5173/?debug`; `window.__COIN_TOWER__` supports `snapshot()`, `freeze(boolean)`, and `advance(milliseconds)`. See `docs/DEVELOPMENT.md`; the hook is excluded from production.
- CrazyGames preview videos: run `rtk npm run dev:crazygames -- --port 5191`, then `rtk proxy node scripts/record-preview-frames.mjs <landscape|portrait> <frames dir>` and `python3 -I scripts/encode-preview-video.py` (needs ffmpeg via PATH or `FFMPEG`). Method and limits: `docs/art/crazygames-preview-videos.md`.
- Validation status and environment limits: `docs/VALIDATION.md`. Update this section when a command changes or breaks; use these commands before claiming gameplay validation.

## Boundaries and development policies

- Game rules, save schema, session state, and asset manifests belong in `src/game/`; runtime assets in `public/assets/`; identity, resolution, and feature flags in `src/config/game.ts`.
- `src/main.ts` and `src/app.ts` compose the application. `src/core/` and `src/services/` are reusable and must not import `src/game/` or game asset keys. `src/ui/Shell.ts` owns HTML controls; `Session` owns run time and `GameController` connects actions to common services. Read ADR 0002 before changing pause/input ownership.
- Inspect actual project/runtime state through available reliable tools; use direct file operations where appropriate and current official documentation for uncertain Phaser APIs. Phaser 3 rendering examples need verification against installed Phaser 4 types/source.
- Read architecture contracts before modifying common APIs. Record exact dependency versions, lockfile changes, licenses, and compatibility evidence in `docs/DEPENDENCIES.md`.
- Save schema changes require old-data migration fixtures. Preserve unreadable source data until an explicit user reset. Wrap real SDKs in adapters; production Mock success must never grant transactions or rewards.
- Run `check` for changes, E2E for UI changes, and production E2E for service/build behavior changes. Report actual local results separately from imported template validation and unverified browsers/devices.
- Keep current design rules in `docs/GAME_DESIGN.md` and linked `docs/design/<system>.md`, each rule in one authoritative location. Read the overview, relevant systems, and affected dependencies; list headings before reading a large document whole. Use `docs/IMPLEMENTATION_PLAN.md` for substantial work or handoffs.
- Store generated project documents under `docs/`; keep root AGENTS/CLAUDE/README files and the project's source/asset layout. When updating a legacy root document, preserve it in the equivalent `docs/` destination and update links, reconciling any existing content.
- Record cross-system, lasting, or costly technical decisions in `docs/adr/` using Context, Decision, Alternatives, and Consequences.

## Language and decision status

- Korean: user communication, concept/design/art/audio direction, other user-facing documents, and explanatory code comments. English: agent instructions, implementation handoffs, ADRs, code identifiers, and filenames. English copies are provided on request.
- [Decided] The game's player-facing UI is English for CrazyGames preparation; the document/comment language policy above is unchanged.
- Labels: `[결정]` / `[Decided]` = user confirmed; `[제안]` / `[Proposed]` = awaiting confirmation; `[미결]` / `[Open]` = unresolved; `[가설]` / `[Hypothesis]` = needs play or production evidence. Only the user can move an item to Decided.

## Version control

- Local Git on `main`; no remote configured. Branch, push, and history-rewrite rules await the user's workflow. Git LFS is deferred until asset size and remote support justify it.
- Commit validated checkpoints with messages describing the player-visible change. Never commit secrets, signing material, local editor files, generated caches, or build outputs; use `.gitignore`.
