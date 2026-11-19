#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORT="${PREVIEW_TEST_PORT:-18743}"
CHROME="${CHROME_BIN:-$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)}"
if [ -z "$CHROME" ]; then echo 'Chromium unavailable; browser test not executed' >&2; exit 2; fi
TMP="$(mktemp -d)"
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; rm -rf "$TMP" 2>/dev/null || true; }
trap cleanup EXIT
(cd "$ROOT" && python3 -m http.server "$PORT" --bind 127.0.0.1 >"$TMP/server.log" 2>&1) & SERVER_PID=$!
for i in $(seq 1 30); do if python3 - "$PORT" <<'PY'
import sys,urllib.request
try: urllib.request.urlopen('http://127.0.0.1:'+sys.argv[1]+'/tests/browser/smoke.html',timeout=.2)
except Exception: sys.exit(1)
PY
then break; fi; sleep .2; done
timeout 18 "$CHROME" --headless --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --disable-extensions --user-data-dir="$TMP/chrome" --virtual-time-budget=4000 --dump-dom "http://127.0.0.1:$PORT/tests/browser/smoke.html" > "$TMP/result.html" 2>"$TMP/chrome.log" || { tail -30 "$TMP/chrome.log" >&2; exit 1; }
if grep -q '<div id="result">PASS</div>' "$TMP/result.html"; then echo 'Browser smoke: PASS'; else echo 'Browser smoke: FAIL'; grep -o '<div id="result">[^<]*' "$TMP/result.html" || true; exit 1; fi
