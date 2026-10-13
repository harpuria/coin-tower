# 0005 — Persist before publishing skin purchases

Status: implementation decision for the user-adopted skin purchase/save behavior in `design/economy.md`.

## Context

Completed runs must remain playable when persistence fails, so the existing `Store.update()` publishes in-memory rewards before `flush()`. Skin purchases have a different agreed outcome: failed persistence must leave balance, ownership and equipped skin unchanged. An update followed by flush would publish a purchase that was not saved.

## Decision

Add generic `Store.commit(change)` alongside update/flush. It validates a cloned candidate, writes one versioned envelope, and publishes the candidate in memory only after a successful write. Failure keeps the previous in-memory value and dirty state, marks storage unavailable and blocks later writes under the existing source-protection policy. The common store has no skin or game identifiers.

The game controller owns confirmed purchases and equip actions. A purchase writes balance, ownership and equipped skin in one commit; completed runs continue using update/flush and preserve the added skin fields. Progress schema v4 migrates v1–v3 sequentially, retaining records and shards and adding owned/equipped gold. Skin UI state is transient controller state, separate from the run simulation.

## Alternatives

- Update, flush and roll back: exposes the unsaved purchase and complicates dirty/status rollback.
- Separate balance/ownership/settings keys: allows partial persistence and makes a purchase inconsistent.
- Game controller writes localStorage directly: duplicates version/status/source-protection rules and crosses the store boundary.

## Consequences

Failed purchases and equip changes cannot grant temporary ownership or spend shards. Once storage is unavailable, purchases/equip changes are disabled; free play and existing completion behavior remain usable. This is one synchronous localStorage write, not cross-tab coordination or cloud/SDK billing. Last-write-wins across tabs remains the existing limitation.
