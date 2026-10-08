# ADR 0004 — CrazyGames native weekly leaderboard

## Context

The user prefers to avoid external services and accepted one CrazyGames weekly height leaderboard plus two all-time browser personal records on 2026-10-08. CrazyGames currently supports only one leaderboard per game, weekly resets, and invitation-based access. The earlier research investigated two all-time boards and recommended an external database; that proposal was not implemented.

## Decision

- Use CrazyGames native leaderboard storage, platform ranking widgets and tie policy. Submit only completed run height through the client SDK. Keep local height/combo save schema v2 and result/menu NEW BEST semantics.
- Use descending, non-incremental points for weekly best height. Submit the current run value independently of local all-time best improvements. Confirm actual season-best preservation in portal Preview.
- Use the existing `CrazyGamesIntegration`/`PlatformServices` boundary for account checks and score submission. Keep completion eligibility in `game/`, and application lifetime in `App`. Do not initialize another SDK instance.
- Follow official client score encryption and `user.submitScore()` rather than provisioning an external JWT verifier, database, or score API. The client Encryption Key is not a secret trust boundary; server API credentials must not be shipped in a browser build.
- Keep guest play/local saving available when account or leaderboard functionality is unavailable. Do not infer server acceptance from SDK success responses.
- Prepare/upload/preview the existing personal-record playable first. Connect leaderboards when invited; registration, review submission or Full Launch do not by themselves establish access.

## Alternatives

- Supabase, Workers+D1 and Firebase can support the former two-board requirements, but introduce backend operations and potential spend the user wants to avoid. The historical [comparison](../research/leaderboard-services.md) remains a reference.
- A single global combo board would emphasize precision but was not the adopted metric.
- Keeping the original two all-time global boards requires capabilities not currently offered by native leaderboards.

## Consequences

Global competition is weekly and height-only. Perfect remains a separate personal record. Platform ties and widgets replace custom rank/order promises. Client-side score manipulation remains possible; encryption and platform checks do not establish authoritative gameplay. Local storage is still browser-scoped and is not automatically cloud-synced.

Actual game entry, upload, invitation, configuration, lower-score handling and score reflection need portal evidence. Account transitions and season-safe cooldown/retry remain open. This ADR records a technical choice, not completed integration or permission to submit/publish remotely.

References checked 2026-10-08: [leaderboard capabilities/configuration](https://docs.crazygames.com/sdk/leaderboards/), [client SDK submission and response limits](https://docs.crazygames.com/sdk/leaderboards-client/), [pre-submission Preview and launch process](https://docs.crazygames.com/).
