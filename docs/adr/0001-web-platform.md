# 0001 — Phaser web platform

Status: [Decided] Web 2D and Phaser; [Proposed] initial scaffold defaults for runtime configuration and optional services.

## Context

Coin Tower was developed as a portrait Godot game for native Android. The user requested a Phaser web version, a runnable template scaffold, desktop/mobile browser support with mouse/touch, and local Git initialization.

## Decision

Create a separate web project using `harpuria/phaser-web-template` at commit `b953c81b31cfdb36f73c6462d707a45ec2b8a46d`. Keep the source mobile project read-only as a port reference. Retain portrait composition, initially using its 720×1280 logical dimensions and FIT scaling. Use the template's pinned Phaser/TypeScript/Vite stack and npm lockfile.

Retain the sample game until an initial Coin Tower port slice is agreed. Use a demo-specific persistence namespace and disable optional external-service features in the scaffold. These implementation defaults can change with the port scope.

## Alternatives

- Export the existing Godot project to web: would retain more gameplay code but does not implement the user's Phaser choice.
- Build a bare Phaser project: requires rebuilding common storage/settings/audio/lifecycle foundations already provided by the selected template.

## Consequences

The project can develop and build independently of Android tooling. Godot gameplay and scenes require a Phaser implementation; reusable art can be imported separately. Android Google Play Games, native platform behavior, and validation results require separate web decisions and evidence. Browser-local storage does not transfer native saves or provide a global leaderboard.
