import { createServer } from 'node:http';
import { buildPlayableHtml } from '../../src/playable-export.js';
import { bundleAssets } from '../../src/asset-bundle.js';
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
  // End-to-end asset-rich export: bundled image must render without a network request.
  const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
  const asset={name:'pixel.png',size:png.length,type:'image/png',arrayBuffer:async()=>png.buffer};
  const bundled=await bundleAssets('<!doctype html><html><body><img id="pixel" src="pixel.png"><style>#tile{width:10px;height:10px;background-image:url(pixel.png)}</style><div id="tile"></div></body></html>',[asset]);
  if(bundled.matched!==1||bundled.missing.length)throw new Error('Asset bundle did not match fixture image');
  const assetPage=await browser.newPage();
  await assetPage.setContent(buildPlayableHtml({name:'Asset test',ctaText:'Play',ctaUrl:'https://example.com'},bundled.html),{waitUntil:'domcontentloaded'});
  const image=assetPage.frameLocator('#game').locator('#pixel');
  await image.waitFor({state:'attached'});
  const dimensions=await image.evaluate(async i=>{await i.decode();return {complete:i.complete,width:i.naturalWidth}});
  if(dimensions.width!==1)throw new Error('Bundled image did not render: '+JSON.stringify(dimensions));
  const background=await assetPage.frameLocator('#game').locator('#tile').evaluate(e=>getComputedStyle(e).backgroundImage);
  if(!background.startsWith('url("data:image/png;base64,'))throw new Error('Bundled CSS image did not resolve');
  await assetPage.close();
  // Verify that a nested JavaScript module graph executes in the actual exported iframe.
  const moduleFiles=[
    {name:'main.js',webkitRelativePath:'src/main.js',size:70,type:'text/javascript',text:async()=>"import {answer} from './lib/value.js'; document.body.dataset.answer=answer;",arrayBuffer:async()=>new TextEncoder().encode("import {answer} from './lib/value.js'; document.body.dataset.answer=answer;").buffer},
    {name:'value.js',webkitRelativePath:'src/lib/value.js',size:27,type:'text/javascript',text:async()=>"export const answer='42';",arrayBuffer:async()=>new TextEncoder().encode("export const answer='42';").buffer}
  ];
  const moduleBundle=await bundleAssets('<!doctype html><html><body><script type="module" src="src/main.js"></script></body></html>',moduleFiles);
  const modulePage=await browser.newPage();
  await modulePage.setContent(buildPlayableHtml({name:'Module graph',ctaText:'Play',ctaUrl:'https://example.com'},moduleBundle.html),{waitUntil:'domcontentloaded'});
  await modulePage.frameLocator('#game').locator('body[data-answer="42"]').waitFor({state:'attached',timeout:10000});
  await modulePage.close();
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
