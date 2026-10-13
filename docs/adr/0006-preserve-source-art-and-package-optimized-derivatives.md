# 0006 — Preserve source art and package optimized derivatives

Status: implementation decision for the user's request to preserve source art and reduce initial downloads below 20MB.

## Context

The uploaded bundle contains about 26.6MiB, with PNG images accounting for 95%. Original and AI-generated masters are valuable production inputs, but Vite's default public-directory copy also puts those masters in every upload. HTML and Phaser share artwork URLs and frame coordinates, so independent path or dimension changes can break presentation.

## Decision

Keep source PNGs byte-for-byte at their existing `public/assets/coin-tower/` paths. Commit WebP derivatives beside them. `src/game/art-manifest.json` owns encoding, icon resolution and standalone-only files; `scripts/optimize-assets.py` generates and validates derivatives, recording source/output hashes and decoded-pixel equality in `art-generated.json`. PNG masters, derivatives and provenance remain distinct.

Use lossless WebP with original dimensions for non-icon art. Resize only the eight small icons, preserving their square canvas and relative transparent margins, then encode losslessly. Existing frame coordinates, CSS percentages, simulation, saves and SDK event timing remain unchanged.

`game/art.ts` maps registered source names to runtime WebP paths for HTML and Phaser. Vite disables automatic public-directory copying. A build plugin verifies source/output hashes and settings, then packages only registered derivatives, the WAV and favicon. CrazyGames omits standalone fullscreen art from both requests and output. A CrazyGames build fails if its complete output reaches 20,000,000 bytes.

Python/Pillow is required only to regenerate art; committed derivatives allow ordinary Node builds. The whole-bundle guard is a size ceiling, not a measurement of initial network transfer: duplicate HTML/Phaser requests, CDN encoding and the external SDK can change transfer size. Observe cold first-gameplay transfers and confirm the portal's measurement after upload.

## Alternatives

- Overwrite original PNGs: loses the supplied/generated masters and their provenance.
- Keep default public copying: ships both originals and derivatives and increases total size.
- Lossy compression for every image: unnecessary visual changes for the current size target.
- Delay backgrounds or skins: adds loading states and runtime ownership changes; the current slice meets the local target through image optimization.

## Consequences

Runtime URLs change from PNG to WebP; existing input and asset-failure expectations must follow those URLs. New or edited source art requires registration/regeneration before a build succeeds. Build packaging is explicit, so additional runtime files must be added to the packaging contract. Lossless conversion keeps non-icon pixels and dimensions identical; icon downsampling still needs visual observation. Real portal eligibility and physical-device behavior remain external verification steps.
