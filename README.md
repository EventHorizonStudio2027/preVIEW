# preVIEW

**Don't just watch it. Play it.**

preVIEW is a creator platform for interactive, playable previews of browser games and applications.

## Branding
Default theme: **light mode**, with white and soft-lavender surfaces and violet accents. Brand name casing is always **preVIEW**.

## Repository status
This is a **public** repository by the owner's explicit choice. The `develop` branch currently has an initial import-diagnostics module, unit tests, a browser test fixture, and CI. The **full v1.3 editor, checkpoint SDK, and branding assets are not yet committed here**. Until [issue #1](https://github.com/FatesPassage/preVIEW/issues/1) is resolved, the repository is **not** a runnable full product.

## Development
- `npm test` runs the unit tests currently committed.
- `main` is the stable branch; `develop` is for integration work.
- CI checks both unit tests and required application files. A failed source-integrity check means the repository is incomplete, **not** that the local prototype failed its tests.
- Browser testing is tracked in [issue #2](https://github.com/FatesPassage/preVIEW/issues/2).

## Security
Never commit credentials, API keys, private information, or uploaded third-party games. Treat game HTML and checkpoint payloads as untrusted content.

## Open blockers
- [#1 — Complete application source and brand assets](https://github.com/FatesPassage/preVIEW/issues/1)
- [#2 — Deterministic Chromium browser smoke test](https://github.com/FatesPassage/preVIEW/issues/2)
