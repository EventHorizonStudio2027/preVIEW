## v1.7 update
Timeline duration utilization meter with accessible progress semantics, overflow warning, and reduced-motion support.

# preVIEW — creator workspace v0.2

A local-first, static HTML/CSS/JavaScript prototype of the preVIEW creator dashboard and manual gameplay moment editor.

## Run

From this directory: `python3 -m http.server 8000` then open `http://localhost:8000` in a browser. ES modules require a local HTTP server. No installation or cloud account is required.

## Tests

`npm test` (Node.js 20+ recommended).

## Implemented

- Responsive creator dashboard and navigation
- Self-contained HTML game preview in a restricted iframe
- Timestamped manual moments, rename, reorder, remove
- Local browser persistence of project metadata
- Export/import project backups and export versioned preview manifests
- CTA URL validation, data validation, file size limits

## Important limitations

- Imported game files are not persisted; reimport them after refresh or restoring a backup.
- Single HTML files with relative assets may fail to load. Full ZIP game bundle ingestion is not yet implemented.
- No gameplay video recording, input capture, replay, game-state checkpointing, AI Director, hosted publishing, or conversion analytics.
- LocalStorage is a convenience, not a reliable production database. Do not upload confidential or untrusted game code; iframe sandboxing is only one security layer.
- Demo dashboard values are local project metadata, not live analytics.

## Next engineering milestone

Add a versioned game integration SDK for deterministic checkpoints and a playable runtime that can actually restore selected moments; then build bundle import and automated compatibility tests.

## v0.3 SDK checkpoints

Run `npm start` and open http://localhost:8000. Select **Load playable demo**, collect stars, start a session, mark a moment, then select **Save checkpoint**. Change the score and use **Restore** on that moment to return to the captured state.

For an integrated game, add `<script src="path/to/sdk.js"></script>` and call `preVIEW.register({capture: () => ({ /* JSON state */ }), restore: (state) => { /* apply state */ }})`. The SDK is opt-in; ordinary uploaded HTML games still support manual moment timestamps, but not checkpoints. Imported single HTML files cannot resolve local sibling files; use the hosted demo or a self-contained HTML file.

**Security:** The iframe uses an opaque sandbox origin; messages are validated against the frame window and an unpredictable per-load session token. Checkpoint data is limited to 250 KB. Do not store passwords or personal data in game checkpoints. The prototype is not a production-grade untrusted-code hosting service.

**Limits:** This is not a video recorder, an automatic playable-trailer composer, or an AI agent. Local JSON exports include SDK checkpoint states where present. Game binaries are not included in exports.


## v0.4 guided walkthrough
After loading an SDK-enabled game, mark moments and save a checkpoint for each. The **Guided walkthrough** controls restore those moments in the chosen order, letting the creator play each moment and manually advance. No video recording, timed playback, standalone playable export, or AI automation is claimed. Uploaded game HTML is not persisted in the project backup.

## v0.5 timed sequence prototype

Load the built-in checkpoint demo or an SDK-enabled HTML game. Mark moments and capture a checkpoint for each. Choose 5–20 seconds per moment and select **Play sequence**. The editor restores each state and lets the embedded game run until the next step. Stop interrupts the timer; Pause currently cancels playback and requires a restart (it does not freeze the game). This is a local, best-effort demonstration: no deterministic input replay, hosted publishing, video recording, asset bundling, or AI discovery. Browser integration testing is still required.


## v0.6: Per-moment timing and cooperative pause/resume

Each moment now has an editable duration (3–30 seconds). Old projects without a duration use the default playback setting. The timeline schedule calculates offsets from individual durations. The demo implements optional `pause` and `resume` SDK hooks. Real pause/resume is only supported for games that implement both hooks; arbitrary imported games cannot be frozen safely by the host. If an SDK hook is missing, the editor reports that pause/resume is unsupported.

Example:
```js
preVIEW.register({
  capture: () => ({ level, score }),
  restore: state => { level = state.level; score = state.score; render(); },
  pause: () => { gamePaused = true; },
  resume: () => { gamePaused = false; }
});
```

Security note: the iframe is sandboxed, but arbitrary uploaded HTML is still untrusted code. Do not use the prototype to process confidential builds. Hosted multi-file imports and automated AI exploration are not implemented.


## v0.7 changes
- Drag-and-drop moment reordering (existing up/down buttons remain available for keyboard users).
- Live total sequence duration and target budget warning.
- Strict backup import normalization, duplicate-ID checks, and CTA URL validation.
- Additional regression tests for import security and timeline ordering.

**Limitations:** browser integration and mobile testing are still pending; drag-and-drop is not a substitute for the accessible up/down buttons.

## v0.8 — SDK game-event telemetry
- SDK-enabled games can call `preVIEW.emit('boss_defeated', 'First boss')` to report a named event to the editor.
- Editor displays the 12 most recent events, retains at most 100 events in memory, and can suggest a manual moment title/category from the latest event.
- This is **rule-based event assistance**, not AI discovery. Events are not uploaded, exported, or persisted.
- The parent still validates the sandboxed iframe source and per-load session token; SDK events are treated as untrusted text.
- Node regression suite: 26 passing. Browser smoke harness at `tests/browser/smoke.html`; a headless Chromium run timed out in this environment, so real-browser integration remains **unverified**.

## v0.9 import diagnostics
The editor now checks imported HTML for referenced local assets, remote URLs, unsafe schemes, and an apparent checkpoint SDK registration before loading. This is a static advisory check, not a comprehensive HTML security parser or malware scanner. Complete multi-file bundle importing remains unsupported.

## v1.0 editor reliability
- Checkpoints can be attached to a selected timeline moment instead of only the latest one.
- Timed playback now clears its timer before requesting pause, guards concurrent pause/resume transitions, and attempts to resume a paused game on stop.
- Editing a project name no longer replaces the focused input value on every keystroke.
- Browser integration remains unverified; these changes need end-to-end testing.


## v1.1 — Light identity

The light-mode identity uses #FFFFFF, #F7F5FF, #E9E1FF, #7958E8, #A994FF, and #2B2E3A. Cropped raster assets in `assets/brand/` originate from the approved light-mode concept board. The vector mark is an implementation-friendly approximation. The app now uses these assets in navigation, hero, empty state, project thumbnail, and favicon. The source brand board remains a visual concept, not a vector master.

## v1.2 import diagnostics
The static scanner now detects unquoted HTML asset references, `srcset`, CSS `url()` and `@import`, and unsafe local paths. It does not sanitize or execute imported HTML and is **not** a security boundary; the sandboxed iframe remains necessary.

## v1.3 browser verification
`npm run test:browser` attempts a Chromium browser smoke test. In this environment Chromium timed out; this is **not** a browser verification pass. GitHub issues #1–#3 track source synchronization, browser verification, and public repository visibility.

## v1.4
- Added compact timeline hover/focus affordances with reduced-motion support.
- GitHub develop has the matching timeline-polish stylesheet, but complete source sync is still blocked.

## v1.5 interface refinement
Added a visible-on-focus skip navigation link, programmatic main focus target, keyboard focus indicators, and reduced-motion handling. Three static accessibility regression checks were added.

## v1.8 engineering notes
- Local-only project cards now explicitly display **Local draft**; they are not hosted or published.
- Browser integration uses `npm run test:browser` (Playwright; install with `npm install` then `npx playwright install chromium`). This environment's system Chromium previously hung. Passing Node tests does not establish browser correctness.
- GitHub's `develop` branch may be missing source files until source-integrity CI passes; do not merge into `main` while blocked.

## v2.0 first-run UX
The empty player now offers a prominent **Try the playable demo** action. The browser smoke test remains blocked by this execution environment (local HTTP requests receive ERR_BLOCKED_BY_ADMINISTRATOR); do not claim browser verification passed.

## v2.2 UX and reliability
Advanced walkthrough, timed playback, and telemetry tools are collapsed by default to reduce editor clutter. Removing a game, resetting the workspace, or loading another game clears any pending Undo action, preventing moments from being restored into the wrong project. Export readiness now explicitly says it refers to a planning manifest, not a published playable build. Local automated tests cover these behaviors. Browser integration still needs verification.

## v2.3 — validation and publication clarity
- Uses shared model URL validation in export readiness to reject malformed HTTP(S) URLs.
- Import inspection errors now show a user-facing message and reset the file chooser.
- Workspace header explicitly displays **Not published**; a planning manifest is not a deployed playable preview.
- Includes six additional regression tests.
- GitHub source sync and browser smoke remain release blockers; no hosted deployment is claimed.

## v2.4 — HTML import safety and diagnostics

- The importer blocks unsafe references using the **complete** inspection count, not the first 100 references shown in the report.
- Encoded parent-directory traversal, encoded unsafe schemes, malformed percent encoding, and backslash paths are classified as unsafe.
- Local and remote asset counts appear in a compact contextual status strip beneath the player. Remote assets are network-dependent; local relative files may not work when importing one HTML file.
- Added eight automated tests across import security and diagnostics; local Node suite: **89/89 passed**.
- This is static import inspection, not a comprehensive HTML malware scanner. Imported game scripts execute only within the sandboxed iframe; review untrusted games before importing.
- Changes committed to `develop`; do not merge to `main` without a green CI run for the new commit.

## v2.5 — Creator journey

- New responsive three-stage navigation (Import → Moments → Review) with live completion indicators and keyboard-accessible controls.
- Stage completion derives from current project data and updates after changes; it is a progress guide, not a publication claim.
- Browser back/forward navigation now synchronizes the active workspace view.
- Six new automated checks; local Node suite: **95/95 passed**.
- Development is on `develop`. GitHub Actions status for the latest changes must be verified before a release.

### v2.5.1 — Progress accuracy and navigation polish

- Creator progress now uses the same URL parser as the model and backup validator, so malformed destinations cannot falsely mark Review complete.
- Moments no longer appear completed without an imported source.
- Current workflow stage is visibly highlighted and announced with `aria-current="step"`; unchanged hash routes are not rewritten.
- Local regression suite: **99/99 passing**. GitHub CI verification is tracked in [active issue #1](https://github.com/FatesPassage/preVIEW/issues/4).

## v2.6 — Honest source availability

- Creator journey distinguishes a remembered source filename from a currently loaded playable game.
- Restored projects and refreshed tabs show **Reimport the game to play it** until the source is loaded.
- Review cannot be marked complete with a missing game source.
- The project overview marks a missing source as **Reimport to play** instead of implying the game is loaded.
- New regression tests cover source availability; **105/105 local Node tests passed**. CI for the latest develop commit still requires confirmation.

## v2.7 — Export readiness safeguards
- Export is blocked when the game source has been lost after reload or backup restore, or when other readiness checks fail.
- Export view is explicitly **Review & export**; no deployment or publishing is implied.
- Readiness checklist has clearer visual grouping and spacing.
- Six new regression tests; local Node suite **111/111 passing**.
- Exported artifact is a planning manifest, **not** a playable, hosted build.

## GitHub Pages deployment preparation
- Added `.github/workflows/pages.yml` to deploy the stable `main` branch to GitHub Pages, once the workflow reaches `main` and Pages is configured to use GitHub Actions.
- Expected public URL after successful deployment: https://fatespassage.github.io/preVIEW/ (not confirmed live yet).
- Do not treat the GitHub Pages URL as working until the Pages deployment job succeeds. `develop` remains the development branch.
- Export action now visually disables when the readiness checklist fails; its existing click-time validation remains as a second guard.

## v2.8 — Site release safeguards
- GitHub Pages workflow checks for index.html, application JS/CSS, demo HTML and brand asset before uploading.
- Overview no longer suggests the exported planning blueprint is directly shareable.
- Export action shows disabled and enabled states based on readiness.
- 115/115 local Node tests passed. Public Pages deployment still requires live verification.

## Original preVIEW brand restored
The creator workspace now displays `assets/brand/wordmark-light.png` in navigation and `assets/brand/brand-mark.png` in the hero and project tile. The temporary `mark.svg` remains in the repository only for compatibility, not as the displayed logo. Four brand regression tests protect the asset references.

## v3.1 — Planning manifest vs guided playback
- Checkpoints are optional for planning manifest export, but still required for guided playback.
- Export blockers and optional setup notices appear separately in the review panel.
- Missing source, invalid CTA, empty moments and overlong timeline remain export blockers.
- Added six focused regression tests. Live publication of exported playable builds is not implemented.

## v3.2 — Standalone playable HTML export
- Review & Export now downloads a single HTML file embedding the imported game's HTML source as base64 and rendering it inside a sandboxed iframe.
- CTA is displayed as an external link with rel=noopener noreferrer; titles and labels are escaped.
- Export works without marked moments or optional SDK checkpoints. JSON manifest and project backup remain available.
- This is a portable file, **not an automatically hosted URL**. Games with relative assets or remote dependencies may not function offline; import only trusted games.
- Seven regression tests cover shell, isolation, escaping, validation and naming.

## v3.3 — Playable export verification and security
- Re-check unsafe asset references at export time, not just import.
- Chromium browser smoke now actually opens and clicks a button inside generated standalone HTML and checks Unicode/CTA fidelity.
- Add three unit regressions for unsafe references, Unicode encoding, and size limits.
- Review UI clarifies single-file deliverable, self-hosting and missing asset bundling. Hosted links remain a future feature.

## v3.4 — Playable export health
- Review & Export now shows the imported game's source size and counts of local, remote and unsafe asset references.
- Unsafe references disable playable export before download; local and remote dependencies remain visible as caveats.
- Seven unit tests cover source diagnostics and interface behavior. Asset bundling and hosted links remain outstanding.

## v3.5 — Local asset bundling (initial support)
- Review & Export accepts additional local files and embeds matched HTML/CSS asset references as data URLs into the standalone playable HTML.
- Selected asset counts are visible, unmatched assets are reported, and six unit tests cover bundling.
- Limits: up to 30 MB selected matched assets; relative imports inside JavaScript modules, dynamic fetch paths and nested CSS dependencies are not yet rewritten. No hosted publishing yet.

## v3.6 — Bundling reliability
- Reject ambiguous same-name asset matches rather than silently choosing a wrong file.
- Preserve missing-asset warnings in the final export notification.
- Improve static srcset reference substitution and clarify offline limitations in the export interface.
- Three regression tests cover exact matches, ambiguous assets and srcset.

## v3.7 — Folder selection and preflight
- Add asset-folder picker for nested game files, with deterministic path matching.
- Show matched, missing, ambiguous references and selected asset size before exporting.
- Reject duplicate paths, clear selections when unloading games, and add five regression tests.
- Limitations: folder selection depends on browser support; nested CSS, dynamic fetch and module imports remain unsupported; hosted publishing not yet implemented.

## v3.8 — Reliable export gating
- Playable export is disabled until all detected local assets are uniquely matched.
- A 30 MB bundle cap is shown in preflight and enforced before file reads.
- Export handler independently refuses unresolved assets; missing assets cannot be silently shipped.
- Six regression tests and clearer export copy. Remote assets and dynamic runtime dependencies remain outside current coverage.

## v3.9 — Actionable export health
- Export health panel shows actual missing filenames and ambiguous matches instead of generic counts.
- Remote dependency warning explicitly states internet is required.
- Bundle size estimate counts each unique selected file only once, avoiding false oversize warnings.
- Five regression tests for diagnostics and size accounting.
- Static asset scanner still does not resolve runtime JavaScript or nested CSS dependencies.

## v4.0 — Static URL compatibility
- Inline cache-busted and fragment-suffixed quoted asset references without retaining URL query parameters on data URLs.
- Inline unquoted CSS url() paths and srcset candidates.
- Improve export checklist microcopy and add four URL regression tests.
- Dynamic JavaScript and nested external stylesheet dependencies remain unsupported.

## v4.1 — Asset-rich exported game browser verification
- Extend Playwright smoke test to bundle a real 1x1 PNG into game HTML, export it, and verify the image decodes inside the sandboxed playable iframe.
- Verify bundled CSS background-image resolves to a data URL in the exported game.
- Add three regression tests for shared image/CSS references and browser coverage.
- Improve health-panel guidance for creators fixing missing assets.
- This does not yet cover nested external CSS, module imports or dynamic fetch.
