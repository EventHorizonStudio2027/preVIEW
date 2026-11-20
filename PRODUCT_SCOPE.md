# preVIEW — Product Contract (Phase 2: Focus)

## The product in one sentence
preVIEW helps creators turn a **browser-based HTML/JavaScript game** into a **short, tested, playable preview** that can be exported as a standalone HTML file.

## Only three customer jobs
1. **Import and run.** Load an HTML game, select required local assets, inspect dependencies, and test it in the sandboxed player. Reject unsupported imports with actionable errors.
2. **Choose and rehearse moments.** Mark moments and, when the game implements the opt-in checkpoint SDK, capture/restore states, order them, and rehearse a timed sequence. Without SDK integration, manual timestamps are notes—not restorable checkpoints.
3. **Export a playable artifact.** Bundle supported local assets into a standalone HTML preview, validate dependencies and size, and make the result available for download. A planning manifest is NOT a playable artifact.

## Non-goals — do not build these without a new product decision
- Video recording or editing, AI-generated gameplay, automatic gameplay discovery.
- Social feed, marketplace, subscriptions, dashboards with simulated conversion analytics.
- Native executable/Unity/Unreal import, arbitrary npm package resolution, arbitrary game-state replay.
- Hosted publishing presented as available before real storage, isolation, domain routing, security, and deployment exist.

## Definition of done for the three jobs
- **Import:** a multi-file fixture loads and runs in real Chromium; missing, unsafe, and ambiguous assets produce specific errors; untrusted HTML remains sandboxed.
- **Moments:** checkpoint-enabled fixture captures and restores states; playback/pause/resume behavior is verified; non-SDK games are clearly labeled as manual-only.
- **Export:** exported HTML runs independently in a fresh browser context, with assets and module imports functional; no broken or silent partial bundles; size limits enforced.

## Actual service architecture (future hosted sharing)
The static GitHub Pages frontend is a **local-first editor**, not a production publishing backend. Hosted previews require:
- Authentication and ownership checks.
- Durable object storage for game files and versioned artifacts.
- An isolated, restrictive hosting origin for untrusted game HTML.
- A database for projects, releases, share links and access controls.
- Upload validation, content limits, abuse handling, retention/deletion.
- Real browser end-to-end verification of published URLs.

Choose a backend only after defining the hosting security model; no secrets in frontend code. Do not mark publishing complete without an actual deployed URL tested from a separate session.

## Quality gates
1. No inert primary action or fake success state.
2. Every change includes unit tests and, for user-facing workflows, a browser smoke test.
3. Merge only after source-integrity, unit-tests, and browser-smoke are green.
4. Confirm GitHub Pages deployment independently after merge.
5. Maintain one numbered active issue list; archive completed work separately.
6. Each iteration improves a real workflow and at least one visible UI detail, plus a final finishing touch.

## Current release truth
The current browser-only editor supports manual moments, optional SDK checkpoints, and supported standalone HTML exports. Imported source files must be reselected after reload. Hosted share links, persistent file storage, native engine builds, AI gameplay analysis and video recording are **not implemented**.

## Immediate priorities
1. Prove a complete exported preview works in a fresh browser session, including multi-file assets.
2. Replace confusing 'plan' versus 'playable export' labels with explicit outcomes and block incomplete exports.
3. Simplify editor hierarchy to Import → Moments → Export and hide advanced controls until relevant.
4. Design and implement the smallest safe hosted-publishing backend only after isolation and storage requirements are approved.
