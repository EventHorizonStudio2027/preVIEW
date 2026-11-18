# preVIEW

**Don't just watch it. Play it.**

preVIEW is a creator platform for turning compatible browser games and applications into short, interactive previews.

## Product direction
- Creator dashboard and project management
- HTML5 game import and sandboxed playback
- Gameplay moments, checkpoint SDK, timeline, and guided playback
- Event-based moment suggestions
- Eventually: AI Director, analytics, and hosted publishing

## Development status
The existing local v0.8 prototype has not yet been imported into this repository. This initial commit establishes the canonical GitHub home and development conventions. **Do not treat this repository as a deployable app yet.**

## Development conventions
- Keep `main` stable; develop changes in feature branches.
- Run automated tests before merging.
- Never commit credentials, API keys, or untrusted uploaded game bundles.
- Distinguish implemented, tested, and browser-verified features.
- Keep the exact product name **preVIEW**.

## Next steps
1. Import the complete v0.8 source tree.
2. Run Node tests and browser smoke tests in CI.
3. Implement and verify complete game-bundle imports.
4. Harden game sandbox isolation and checkpoint messaging.
