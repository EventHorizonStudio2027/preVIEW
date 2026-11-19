import { spawn } from 'node:child_process';
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
await new Promise((ok, bad) => { server.once('error', bad); server.listen(0, '127.0.0.1', ok); });
let browser;
try {
  const { chromium } = await import('playwright');
  browser = await chromium.launch({ headless: true, timeout: 20000 });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.goto(origin + '/tests/browser/smoke.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('#result').getByText('PASS', { exact: true }).waitFor({ timeout: 10000 });
  await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByRole('heading', { name: 'Build previews worth playing.' }).waitFor();
  await page.getByRole('link', { name: /Preview editor/ }).click();
  await page.getByRole('heading', { name: 'Shape the experience.' }).waitFor();
  if (errors.length) throw new Error(`Browser JavaScript errors: ${errors.join('; ')}`);
  console.log('Browser smoke: PASS (model fixture + app navigation)');
} catch (e) {
  console.error('Browser smoke: FAIL:', e.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise(ok => server.close(ok));
}