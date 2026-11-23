import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPlayableHtml} from '../src/playable-export.js';
import {safeExportName} from '../src/workspace-tools.js';
const project={name:'Test <game>',ctaText:'Play now',ctaUrl:'https://example.com/game'};
test('exports a self-contained HTML shell with sandboxed playable game',()=>{const h=buildPlayableHtml(project,'<!doctype html><title>Test</title><p>Hello</p>');assert.match(h,/sandbox="allow-scripts allow-pointer-lock"/);assert.match(h,/srcdoc=/);assert.match(h,/atob\(encoded\)/);assert.match(h,/Play now/)});
test('escapes project title to prevent markup injection',()=>{const h=buildPlayableHtml(project,'<p>ok</p>');assert.match(h,/Test &lt;game&gt;/);assert.doesNotMatch(h,/<title>Test <game>/)});
test('game source is encoded instead of injected into outer HTML',()=>{const h=buildPlayableHtml(project,'</script><script>alert(1)</script>');assert.doesNotMatch(h,/<script>alert\(1\)<\/script>/)});
test('rejects missing source and invalid CTA',()=>{assert.throws(()=>buildPlayableHtml(project,''),/Import/);assert.throws(()=>buildPlayableHtml({...project,ctaUrl:'javascript:alert(1)'},'<p>x</p>'),/valid HTTP/)});
test('playable download name has safe HTML extension',()=>assert.equal(safeExportName('My Game!','playable'),'preview-my-game-playable.html'));
test('export button exists and distinguishes playable HTML from manifest',()=>{const h=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(h,/id="exportPlayable"/);assert.match(h,/id="exportManifest"/)});
test('app keeps source in memory only while game is loaded',()=>{const s=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');assert.match(s,/function clearGame\(\)\{deletedMoment=null;\$\('undoDelete'\)\.hidden=true;importedHtml=null/);assert.match(s,/importedHtml=html/)});

test('rejects unsafe local traversal and script asset schemes on export',()=>{assert.throws(()=>buildPlayableHtml(project,'<img src="../secret.png">'),/unsafe asset/);assert.throws(()=>buildPlayableHtml(project,'<script src="javascript:alert(1)"></script>'),/unsafe asset/)});
test('preserves Unicode source through base64 without inserting executable outer markup',()=>{const source='<p>你好 🎮 café</p>';const output=buildPlayableHtml(project,source);const encoded=output.match(/const encoded='([^']+)'/)[1];assert.equal(new TextDecoder().decode(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))),source)});
test('rejects oversized imported HTML before encoding',()=>assert.throws(()=>buildPlayableHtml(project,'x'.repeat(20*1024*1024+1)),/20 MB/));

test('refuses to label unresolved local assets as a standalone playable build',()=>{
 assert.throws(()=>buildPlayableHtml(project,'<img src="images/hero.png">'),/unresolved local assets/);
 assert.throws(()=>buildPlayableHtml(project,'<link rel="stylesheet" href="styles/game.css">'),/unresolved local assets/);
 assert.doesNotThrow(()=>buildPlayableHtml(project,'<img src="data:image/png;base64,aGVsbG8=">'));
});
