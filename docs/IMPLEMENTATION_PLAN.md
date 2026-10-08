# Implementation Plan — CrazyGames Account Leaderboards

## Goal

Prepare a reviewable provider recommendation and implementation path for the two leaderboards defined in [records.md](design/records.md). Preserve its confirmed rules and the existing playable. Provider selection and the operational policies below remain [Proposed]; this plan does not authorize provisioning or change game rules.

## Status

- Completed: first playable, original mobile art, mouse/touch, deterministic run simulation, interruptions, and completion-only local records.
- Completed: CrazyGames HTML5 SDK v3 initialization, gameplay events, platform mute, English UI, and hidden custom fullscreen controls in the dedicated build.
- Completed: unlimited Perfect combo, save schema v2 migration, independent local bests, equal menu/result presentation, independent NEW BEST badges, and gold X/0–9 feedback art.
- Completed: PC feedback assessment; retain current Perfect/X size and spacing. Physical-device tuning remains deferred.
- Completed: global periods, ties, and participation rules confirmed in [records.md](design/records.md).
- Current research deliverable: [service comparison and recommendation](research/leaderboard-services.md), checked against official documentation on 2026-10-08. [Proposed] Supabase Postgres + Edge Functions, verifying CrazyGames JWTs in the server gateway. No provider/account/backend has been configured.
- Next: user selection of provider and the operational policies below, followed by slice 1. Screen composition also needs a design decision before slice 3.
- Existing runtime: no login, global query/submission, cloud save, ads, or portal publication. The current local save remains browser-scoped; its values are not authenticated global scores.
- Current deliverable validation: documentation formatting, links to local files, and diff checks only. No runtime or backend validation is claimed for this research task.
- Previous runtime evidence: `check` passed 65 unit tests; standalone browser checks passed 24 development and 16 production checks, with 8 development-only skips; CrazyGames production passed 16 checks (14 fixtures, 2 official SDK local checks). See [VALIDATION.md](VALIDATION.md). Real portal authentication and any backend remain unverified. The latest `dist/` remains the validated CrazyGames build.

## Decision Gates

The confirmed leaderboard rules have one authoritative home: [records.md](design/records.md). The following are operational proposals, requiring user confirmation before becoming implementation policy.

| Gate                | Proposed first scope                                                                                                                                                             | Why it needs confirmation                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Provider and spend  | Supabase for development evaluation; consider Pro for public operation. Set a budget and choose region before provisioning.                                                      | Free availability/quotas and paid usage are operational commitments; traffic is unknown. See research for current pricing. |
| Achievement order   | Order strict improvements by a database-assigned server acceptance sequence; retain server timestamp for audit. Equal/lower submissions never replace either.                    | Client clocks are untrusted. A late submission is ordered when accepted, rather than by its claimed play time.             |
| Guest history       | Do not upload existing browser bests or guest runs retroactively. Keep browser records and global account records separate.                                                      | Legacy local records have no proof of ownership or completion.                                                             |
| Run owner           | Only runs started after server authentication can submit. Bind a run to that account; a guest login takes effect for the next run. Account changes never reassign a pending run. | Resolves login during play and shared-device attribution. Playing continues even if authentication is unavailable.         |
| Submission failures | Save local results first. Retry completed submissions in session memory only, with the same run ID and verified account. Page reload/close loses unsent submissions.             | Durable offline queues and delayed achievement credit would require additional product policy and storage handling.        |
| Initial integrity   | Server-issued run IDs, JWT verification, validation/rate limits, atomic best updates, and duplicate protection. No claim of cheat-proof scores.                                  | A valid login token does not prove client gameplay. Replay verification is a separate, stronger scope described below.     |
| Ranking UI          | Two metric tabs with top entries and the signed-in player's rank, plus guest/login, empty, loading, error, and retry states.                                                     | Placement, page size, profile/avatar use, and result entry points remain design choices.                                   |

Account-specific global bests will be shared through the backend. This does not automatically cloud-sync local browser progress/settings. Revisit CrazyGames progress-save requirements before a later Full Launch; the current Basic Launch preparation remains a separate scope. See [account integration requirements](https://docs.crazygames.com/requirements/account-integration/).

## Proposed Architecture

```text
CrazyGames SDK user module
  -> services/crazygames.ts / platform.ts: account adapter, fresh token
  -> game/records.ts + controller.ts: eligible completed run, run ownership
  -> services/leaderboard.ts: generic HTTP transport, cancellation, errors
  -> Supabase Edge Function: verify CrazyGames JWT, enforce request policy
  -> server-only Postgres transaction: deduplicate run, update both bests
  -> bounded public query: sanitized ranked rows
```

- `App` owns service lifetime and cancellation. `Shell` renders state and invokes actions. Neither game code nor UI calls global SDK methods directly.
- Keep reusable identity/transport contracts in `services/`; they must not import `game/`. Coin Tower metric eligibility, completion rules, and validation belong in `src/game/` and backend game-specific handlers.
- Add Supabase SQL migrations/functions under `supabase/` only after selection. No Supabase browser authentication SDK is necessary for the proposed gateway: the browser sends a CrazyGames token, not a Supabase access token.
- Disable Supabase's default JWT check only for the external-auth gateway, then explicitly verify every authenticated request there. Disabling the default check alone does not authenticate requests. Public query routes never accept writes. See the [Edge Function authentication guide](https://supabase.com/docs/guides/functions/auth).
- Keep database service credentials in server secrets. Lock down tables/RPCs against anonymous or browser writes; the privileged server path must validate the caller and request before accessing them. CORS/origin filtering is supplementary, not authentication.
- Ordinary standalone builds retain guest/local play; if enabled, public ranking queries can work without account support. Account-unavailable hosts cannot submit. Development fixtures remain visibly separate from real server success.

### Authentication boundary

Use SDK v3 `user.isUserAccountAvailable` (property), `getUser()`, user-triggered `showAuthPrompt()`, and add/remove auth listeners. Obtain `getUserToken()` when a server request needs authentication; do not persist tokens. The server verifies RS256 with `publicKey` from the official JSON, expiry and required payload types, and checks `gameId` against server configuration. Use verified `userId` for ownership and verified profile fields for display updates; never trust `__dangerousUserId` or a body-supplied user ID. Fetch the key from the fixed official URL, with a bounded cache and one refresh on a possible key rotation. Do not assume undocumented `aud`/`iss` claims. The SDK documents a one-hour token lifetime and refresh handling. See [CrazyGames user/token documentation](https://docs.crazygames.com/sdk/user/).

### Data and API outline

Proposed server data:

- Profiles keyed by provider + verified user ID, scoped to configured game; current signed username/avatar, not the public raw authentication ID.
- Run registrations with random server run ID, owner, rules version, issuance time, and bounded expiry. Do not use a short expiry that silently excludes valid long/paused runs; define and communicate any technical limit before release.
- Accepted completions keyed uniquely by game + owner + run ID, retaining request fingerprint, validation version, and audit timestamp. A retry with the same body returns its original outcome; a different body for an accepted ID is rejected.
- Personal best rows keyed by game + metric + owner, with integer value, source run, server timestamp, and unique acceptance order. Separate rows allow independent achievements from different runs.

Proposed API:

| Operation                                                       | Authentication                      | Result                                                                                            |
| --------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /leaderboards?metric=coins&cursor=...` (or `metric=combo`) | Public                              | Bounded rows, competition ranks, continuation cursor; no raw user IDs or audit payloads.          |
| `GET /me/records`                                               | Verified CG JWT                     | Server-confirmed account identity, both bests and current ranks.                                  |
| `POST /runs`                                                    | Verified CG JWT                     | Registered run ID and rules version, bound to this account/game. Failure never blocks local play. |
| `POST /runs/:id/complete`                                       | Verified CG JWT, matching run owner | Validated, idempotent completion result and per-metric updates.                                   |

Use one database transaction for completion deduplication and both best updates. Handle concurrent submissions/tabs with unique constraints and conditional updates, not a browser read-then-write. Do not create a combo row for zero. Enforce safe nonnegative integers and `combo <= max(0, coins - 1)`. Reject unknown versions, wrong owners/games, malformed/oversized payloads, expired registrations, and reused IDs with conflicting content. Limits must protect infrastructure without adding an unapproved gameplay combo cap.

Competition rank depends on score alone: `RANK() OVER (ORDER BY value DESC)` for the metric's full eligible population. Apply the tie display order (`acceptance_order ASC`) outside the rank calculation, then paginate. Ranking after pagination or including achievement time in the window's `ORDER BY` would break shared ranks. Benchmark both top-page queries and the player's rank before scaling; cache bounded public pages as needed. See [PostgreSQL window functions](https://www.postgresql.org/docs/current/functions-window.html).

### Failure and integrity limits

- Submission is independent of local save success and never delays TRY AGAIN/MENU. Track pending/submitted/retryable/rejected separately from local NEW BEST. A timeout has an unknown server outcome; retry the same ID.
- Refresh authentication once for an expired token. Retry network/429/5xx with bounded backoff and jitter; honor `Retry-After`. Do not loop on rejected payload/owner mismatch. Preserve pending requests only for their original account, and ignore late responses from disposed apps or previous account generations.
- Authentication and numeric bounds cannot establish that a reported first failure happened. The initial scope remains vulnerable to forged plausible scores and automation. Public competitive operation must explicitly accept this limitation or add replay verification before release.
- Stronger scope: server recomputes completion from a versioned input trace, including timing/pause semantics and a terminal miss; client-reported totals are compared with computed totals. Current `Session.update()` discards leftover time at phase boundaries, so a simple drop-time trace is not yet a verified equivalent. Establish a canonical simulation/replay format and compatibility fixtures before sharing rules with the backend. Replay checks still do not prove a human supplied the inputs.
- Set public-read and per-account/run submission limits, server log redaction, audit retention, record correction procedure, budget alerts, and database backup/restore policy. Choose their numerical values from measured load and the selected plan, not an assumed player count.

## Implementation Slices

### Slice 1 — Account-aware playable, with guest fallback

- **Dependencies:** provider/run-owner/guest-history decisions; game ID and real CrazyGames Preview access for final verification.
- **Files:** `src/services/crazygames.ts`, `platform.ts`, new identity/leaderboard contracts, `src/app.ts`, `src/config/game.ts`, `src/ui/Shell.ts`; focused existing fixture coverage.
- **Direction:** extend the existing SDK adapter rather than reinitializing SDK. Model unavailable/guest/authenticating/authenticated/error states. Add an optional secondary CrazyGames login action and remove listeners/cancel requests on disposal. Backend verifier and `/me/records` establish trusted identity; browser user objects are presentation hints only.
- **Acceptance:** guests start/play/retry normally; optional login/cancel works; unavailable accounts, failed identity fetch, expiry, login during a run, reload/logout, and stale responses never attribute a run to another account. Existing gameplay/mute/fullscreen behavior survives.
- **Exclude:** external login, guest cloud accounts, local-save migration, leaderboards UI.

### Slice 2 — Completed runs reach both server bests

- **Dependencies:** slice 1, accepted integrity/order/retry scope, selected project/region/budget/secrets; record confirmed technical choices in an ADR. Use staging before production.
- **Files:** new `supabase/migrations/`, `supabase/functions/`, `src/services/leaderboard.ts`, `src/game/records.ts`, `src/game/controller.ts`, `src/app.ts`; record contracts and dependency/security configuration documentation.
- **Direction:** register an eligible run without delaying local start; bind owner at start and associate late registration responses with the original run generation. Registration failure keeps the run local; explain when it cannot be ranked. Hook only controller `finished` for submission and keep existing local finalization first. Also handle confirmed restart, which currently calls `Session.start()` through `confirm()` rather than controller `start()`. Home/restart/refresh cannot fabricate completions.
- **Acceptance:** independent higher bests update; lower/tied scores retain first order; combo zero excluded; terminal failure submits once; restarts/home/interim scores never submit. Concurrent requests, duplicate callback, timeout-after-commit retry, conflicting replay, wrong game/user, forged/expired JWT, unavailable keys, and failed local storage have documented outcomes. Cross-user direct DB/RPC writes are denied.
- **Exclude:** durable offline queue, historical score import, gameplay rebalance, cloud settings/progress, anti-bot guarantees.

### Slice 3 — Two public ranking views

- **Dependencies:** slice 2, agreed screen composition/page size, stable query and profile policy.
- **Files:** `src/ui/Shell.ts` and its styles, `src/game/records.ts`, generic query client, backend bounded ranking query; update authoritative UI rules only after user confirmation.
- **Acceptance:** guests view both metrics; 50/50/40 shows 1/1/3; display order respects first accepted achievement; the two metrics can rank differently; combo-zero users do not appear. The signed-in player's rank remains correct outside the top page and across tied page boundaries. Loading/empty/error/retry states and submission status never imply success prematurely. Mouse/touch and small portrait/portal layouts work without accidentally dropping a coin.
- **Exclude:** seasons, friend boards, prizes, extra profile editing.

### Slice 4 — Production and portal readiness

- **Dependencies:** staging slices 1–3, real project credentials and Preview, agreed operational limits/retention/backup and accepted integrity risk or replay implementation.
- **Direction:** validate migrations and rollback/recovery procedure; restrict RPC execution and secrets; measure latency/query cost; configure spend alerts/rate limits; record exact new dependency versions/licenses in `DEPENDENCIES.md`, deployment/secret names in `DEVELOPMENT.md`, and architecture ownership in `ARCHITECTURE.md`.
- **Acceptance:** when implementation is requested, run `check`, standalone and CrazyGames browser checks, build CrazyGames, then production browser checks as documented. Add backend-specific commands only once available and record actual results. In real CrazyGames Preview verify login, username changes, account-unavailable hosts, account switch/reload, cancellation, flaky-network submission, two-device account records, and shared-device isolation. Fixtures/local SDK checks alone cannot satisfy this gate.
- **Release evidence:** update `VALIDATION.md` with build, environments, actual server results, unverified devices, and operational acceptance. Preview access and backend operations remain external requirements; this research task has not performed them.

## Next Request

After choosing the provider and operational scope: `$game-implement docs/IMPLEMENTATION_PLAN.md의 Slice 1 기준으로 CrazyGames 계정 인증과 게스트 fallback을 구현해줘.` State the accepted provider/policies with the request so proposals can be recorded as decisions. Screen design can be resolved before slice 3 without delaying the account/service boundary.
