# 0009 — Gate first play on critical assets

Status: Implemented within the user-authorized loading improvement.

## Context

The release waited for all time-of-day backgrounds, every skin and full-length music before enabling play. Cache-enabled local observation took about 14 seconds at 10Mbps / 80ms. Hidden shop and result HTML images also requested unused skins, so changing only the Phaser preload list would not remove the startup work.

## Decision

Keep first-play artwork, feedback glyphs, sound effects, music and the equipped skin in the critical preload. The existing required-file failure screen and `app.ready` apply to this set. Preserve saved ownership and equipment; an equipped skin never starts as missing art.

`GameController` owns a game-specific `DeferredAssets` instance attached to the playable Scene's Loader and TextureManager. Start prefetch after the first gameplay-start report, or request skins when SHOP is opened first. Limit the Scene loader to two concurrent files. Install source-coordinate frames before publishing skin readiness. Scene shutdown/destroy detaches observers; no independent timers, storage fields or common service contracts are added.

Shell assigns gallery URLs only when the shop is open and the texture is ready, and assigns result-preview URLs only for a ready result. Loading/failed skins have placeholders and disabled actions; controller guards both selection and purchase confirmation. Retry and a subsequent run can retry failed optional files without altering ownership or charging currency.

Scene and Shell share background resolution. Unavailable destinations retain the ready source; if neither requested time is available, use morning. Asset availability never advances or pauses Session time. When an asset arrives after its model transition has ended, show the available model-selected background without creating an independent tween clock.

On failure, stop music before playing the one game-over sound. Optional loading errors never make a failed download look like a completed purchase or a ready texture.

## Alternatives

- Continue preloading everything: simplest but preserves the measured initial wait.
- Defer Phaser images only: hidden HTML still downloads skin previews.
- Block gameplay at background milestones: disrupts input and introduces additional pause/readiness ownership.
- Silently equip another skin after loading failure: contradicts saved equipment and user purchases.

## Consequences

The upload bundle still contains all art. First-play transfer and readiness improve while later requests continue during play. Slow/failed optional downloads can temporarily retain morning or a prepared source background, and unavailable skins remain unselectable until retry succeeds. Browser checks must cover delayed/failed files and equipped-skin reloads separately from normal palette/background observations. A smaller initial transfer is not evidence of portal approval or physical-device performance.
