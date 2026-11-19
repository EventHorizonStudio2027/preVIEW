"""Browser smoke using the system Chromium when the Node Playwright package is unavailable."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *_):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox','--disable-dev-shm-usage'], timeout=10000)
        try:
            page = browser.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            base = f'http://127.0.0.1:{server.server_port}'
            page.goto(base + '/tests/browser/smoke.html', wait_until='domcontentloaded')
            page.locator('#result').get_by_text('PASS', exact=True).wait_for(timeout=5000)
            page.goto(base + '/index.html', wait_until='domcontentloaded')
            page.get_by_role('heading', name='Build previews worth playing.').wait_for(timeout=5000)
            page.get_by_role('link', name='Preview editor').click()
            page.get_by_role('heading', name='Shape the experience.').wait_for(timeout=5000)
            page.get_by_role('button', name='Load playable demo').click()
            page.locator('#gameFrame').wait_for()
            print('Browser smoke: PASS (model, navigation, demo import)')
            assert not errors, f'Browser JavaScript errors: {errors}'
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
