# 0008 — Project the world with model-owned zoom

Status: Implemented under the agreed gentle difficulty design.

## Context

Late-run zoom must shrink the playable coins and tower while leaving backgrounds, feedback labels and native HTML controls readable. Model coordinates still define movement and landing. Pause/countdown, deterministic advancement and result/reset must preserve a single camera timeline.

## Decision

`Session` owns `zoom` and interpolates it alongside the vertical offset during settling. Spawn selects the next speed; moving and dropping never change zoom. The existing model freeze/reset paths apply to both values.

Keep the Phaser camera unscaled. Scene projects world x around the viewport center and world y plus the model camera offset around the fixed target-height anchor. Coin dimensions, pedestal, hints and impact graphics use the same scale. Backgrounds, logo, NICE/PERFECT and HTML remain outside that transformation. Visible-coin culling uses projected positions and reuses sprites.

This is a rendering transform: logical positions, collision tolerances, fall speed, rewards and persisted progress remain independent of zoom. Development-only `view()` exposes actual rendered geometry without mutation; production has no observation hooks.

## Alternatives

- Scale the whole camera: also shrinks scene labels/backgrounds or requires additional cameras and exclusion lists.
- Scale each model coordinate: couples collision and saved/run state to visual presentation and complicates pause/reset.
- Use a separate scene tween: introduces a second camera clock that can diverge during deterministic advancement or interruptions.

## Consequences

New world effects must follow the projection; new UI feedback must stay outside it. Browser observations compare rendered targets and moving coins at high scores, while unit tests cover curve boundaries, zoom interpolation and interruption behavior. Scripted high scores establish behavior and geometry, not human difficulty or readability.
