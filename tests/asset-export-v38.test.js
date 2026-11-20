import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planAssets,MAX_BUNDLE_BYTES,bundleAssets} from '../src/asset-bundle.js';
const file=(name,size)=>({name,size,type:'image/png',arrayBuffer:async()=>new Uint8Array(size).buffer});
test('preflight exposes 30MB limit',()=>assert.equal(MAX_BUNDLE_BYTES,30*1024*1024));
test('preflight flags oversized matched assets',()=>{const p=planAssets('<img src="big.png">',[file('big.png',MAX_BUNDLE_BYTES+1)]);assert.equal(p.overLimit,true)});
test('exactly 30MB is within the limit',()=>assert.equal(planAssets('<img src="big.png">',[file('big.png',MAX_BUNDLE_BYTES)]).overLimit,false));
test('bundler refuses oversized assets before reading them',async()=>await assert.rejects(bundleAssets('<img src="big.png">',[file('big.png',MAX_BUNDLE_BYTES+1)]),/30 MB/));
test('export handler blocks unresolved assets',()=>assert.match(readFileSync(new URL('../src/app.js',import.meta.url),'utf8'),/if\(bundle\.missing\.length\)/));
test('export button disabled for incomplete preflight',()=>assert.match(readFileSync(new URL('../src/app.js',import.meta.url),'utf8'),/Boolean\(exportPlan\?\.missing\.length\)/));

test('playable export handler independently checks unsafe game assets',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/const diagnostics=playableDiagnostics\(importedHtml\);if\(diagnostics\.unsafe\)/);
});
test('playable export handler validates HTTP(S) CTA destinations',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/const destination=new URL\(state\.ctaUrl\)/);
 assert.match(app,/destination\.protocol/);
});
test('playable export handler blocks ambiguous and oversized assets',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/if\(plan\.overLimit\|\|plan\.ambiguous\.length\)/);
});

test('playable export prevents duplicate simultaneous downloads',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/if\(playableExportBusy\)return/);
 assert.match(app,/playableExportBusy=true/);
 assert.match(app,/finally\{playableExportBusy=false/);
});
test('playable export shows preparation state and restores label',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/Preparing playable file…/);
 assert.match(app,/exportButton\.textContent='Download playable HTML'/);
});
