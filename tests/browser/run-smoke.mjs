import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const info = await stat(path);
    if (!info.isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});

let browser;
try {
  await new Promise((ok, bad) => { server.once('error', bad); server.listen(0, '127.0.0.1', ok); });
  const { chromium } = await import('playwright');
  browser = await chromium.launch({ headless: true, timeout: 20000 });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const origin = `http://127.0.0.1:${server.address().port}`;

  await page.goto(origin + '/tests/browser/smoke.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#result')?.textContent !== 'RUNNING');
  const fixture = await page.locator('#result').textContent();
  if (fixture !== 'PASS') throw new Error(`Model fixture failed: ${fixture}`);

  await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByRole('heading', { name: 'Build previews worth playing.' }).waitFor();
  await page.getByRole('link', { name: /Preview editor/ }).click();
  await page.getByRole('heading', { name: 'Shape the experience.' }).waitFor();
  await page.getByRole('button', { name: 'Load playable demo' }).click();
  await page.waitForFunction(() => document.querySelector('#gameFrame')?.getAttribute('src') === 'examples/checkpoint-demo.html');
  await page.locator('#gameFrame').contentFrame().locator('body').waitFor();
  await page.getByText('Demo loaded', { exact: true }).first().waitFor();
  if (errors.length) throw new Error(`Browser JavaScript errors: ${errors.join('; ')}`);
  console.log('Browser smoke: PASS (model fixture, editor navigation, demo loading)');
} catch (e) {
  console.error('Browser smoke: FAIL:', e.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.listening) await new Promise(ok => server.close(ok));
}
