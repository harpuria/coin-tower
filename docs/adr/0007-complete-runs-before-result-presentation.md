# 0007 — Complete runs before result presentation

Status: Implemented under the agreed first quality-improvement design.

## Context

The first missed coin now tilts and falls before the result overlay opens. Records and rewards must remain final even if the page is hidden or closed during that presentation. Onboarding also needs to persist completion during a run without saving unfinished scores. The result screen can open the skin shop and return after a purchase.

## Decision

Keep the one-shot `finished` event at the miss. `Session` immediately enters `result`, clears the streak and starts `failureRemaining`; `resultReady` becomes true after the model-owned presentation interval. `GameController` settles records/rewards and stops gameplay at `finished`, while `Shell` waits for `resultReady` before exposing result actions. Backgrounding freezes the remaining presentation time and does not turn the completed run into an abort. Rendering offsets/rotation never change landing coordinates.

Progress v5 adds `onboardingComplete`. Completing or skipping hints uses game-controller update/flush independently of run completion. On storage failure the validated memory state hides hints on this page while the protected source remains unchanged. Existing saves migrate with hints incomplete and retain all records, balances and skins. Common Store APIs are unchanged.

Opening the shop leaves the completed Session mode and RunResult intact. BACK closes the overlay and restores the originating menu/result. EARNED and record-break flags remain the completion snapshot; result TOTAL and skin targets read the current wallet after purchases. Shop transitions never emit another finished event or gameplay start. `GameController.runSkin` captures the equipped skin on run start, so purchases update the next run without changing the completed tower. Shell reveals the originating result before restoring focus to TRY AGAIN.

## Alternatives

- Delay `finished` until animation completion: makes rewards depend on presentation and risks losing a completed run on interruption.
- Use independent scene/DOM animation clocks: makes deterministic advancement and background freezing harder to keep consistent.
- Persist onboarding only at failure: repeats completed onboarding after an unfinished run is abandoned.
- Return all shop visits to the menu: loses the agreed quick result-to-purchase-to-retry flow.

## Consequences

Tests distinguish logical completion from visible results. Migration fixtures cover v1–v4, and controller/browser checks cover early onboarding persistence, page-only fallback, immediate one-shot settlement, the presentation delay and purchase/return without duplicate rewards. Future result UI must preserve the run snapshot while refreshing wallet state.
