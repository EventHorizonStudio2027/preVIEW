import { createServer } from 'node:http';
import { buildPlayableHtml } from '../../src/playable-export.js';
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
let page;
try {
  await new Promise((ok, bad) => { server.once('error', bad); server.listen(0, '127.0.0.1', ok); });
  const { chromium } = await import('playwright');
  browser = await chromium.launch({ headless: true, timeout: 20000 });
  page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  const failedResponses = [];
  page.on('response', response => { if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`); });
  page.on('pageerror', e => errors.push(e.message));
  const origin = `http://127.0.0.1:${server.address().port}`;

  await page.goto(origin + '/tests/browser/smoke.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#result')?.textContent !== 'RUNNING');
  const fixture = await page.locator('#result').textContent();
  if (fixture !== 'PASS') throw new Error(`Model fixture failed: ${fixture}`);

  await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByRole('heading', { name: 'Build previews worth playing.' }).waitFor();
  await page.locator('[data-step="import"]').waitFor();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-step="import"]').waitFor();
  // A remembered filename cannot count as an active playable source after reload.
  await page.evaluate(() => localStorage.setItem('preview-project-v2', JSON.stringify({
    name:'Recovered', fileName:'previous.html', moments:[], duration:60,
    ctaText:'Play', ctaUrl:''
  })));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-step="import"]:not(.completed)').waitFor();
  const importLabel = await page.locator('[data-step="import"]').getAttribute('aria-label');
  if (!importLabel?.includes('Reimport')) throw new Error('Missing game source did not prompt reimport');

  if (await page.locator('[data-step="import"]').getAttribute('class') === 'completed') throw new Error('Fresh project should not mark import completed');
  await page.getByRole('link', { name: /Preview editor/ }).click();
  await page.getByRole('heading', { name: 'Shape the experience.' }).waitFor();
  await page.locator('#loadDemo').click();
  await page.waitForFunction(() => document.querySelector('#gameFrame')?.getAttribute('src') === 'examples/checkpoint-demo.html');
  await page.locator('#gameFrame').contentFrame().locator('body').waitFor();
  await page.waitForFunction(() => document.querySelector('#sessionStatus')?.textContent === 'Demo loaded');
  await page.locator('[data-step="import"].completed').waitFor();
  await page.locator('[data-step="review"]').click();
  await page.getByRole('heading', { name: 'Prepare your preview.' }).waitFor();
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.getByRole('heading', { name: 'Shape the experience.' }).waitFor();
  // Exercise the actual exported artifact, including Unicode, sandboxed interaction and CTA.
  const exported = buildPlayableHtml({name:'Arcade 🎮',ctaText:'Play the full game',ctaUrl:'https://example.com/full'},
    '<!doctype html><html><body><button id="counter" onclick="this.textContent=\'Clicked ✓\'">Click me 🎮</button></body></html>');
  await page.setContent(exported, { waitUntil: 'domcontentloaded' });
  const game = page.frameLocator('#game');
  await game.locator('#counter').waitFor();
  await game.locator('#counter').click();
  if (await game.locator('#counter').textContent() !== 'Clicked ✓') throw new Error('Exported playable game did not respond to interaction');
  if (await page.locator('a.cta').getAttribute('href') !== 'https://example.com/full') throw new Error('Exported CTA destination incorrect');
  if (!await page.getByText('Arcade 🎮').count()) throw new Error('Exported title lost Unicode characters');
  if (failedResponses.length) throw new Error(`Failed asset requests: ${failedResponses.join('; ')}`);
  if (errors.length) throw new Error(`Browser JavaScript errors: ${errors.join('; ')}`);
  console.log('Browser smoke: PASS (workspace, demo, exported playable game, Unicode and CTA)');
} catch (e) {
  console.error('Browser smoke: FAIL:', e.message);
  if (page) {
    try {
      await page.screenshot({ path: 'browser-smoke-failure.png', fullPage: true, timeout: 5000 });
      console.error('Saved browser-smoke-failure.png');
    } catch (captureError) { console.error('Screenshot unavailable:', captureError.message); }
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.listening) await new Promise(ok => server.close(ok));
}
