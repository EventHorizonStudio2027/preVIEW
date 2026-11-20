import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bundleAssets,planAssets} from '../src/asset-bundle.js';
const image={name:'pixel.png',size:3,type:'image/png',arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};
test('image and CSS sharing one asset count as one matched file',()=>{const p=planAssets('<img src="pixel.png"><style>.tile{background:url(pixel.png)}</style>',[image]);assert.equal(p.matches.size,1);assert.equal(p.bytes,3)});
test('bundle rewrites image and CSS references in the same HTML',async()=>{const r=await bundleAssets('<img src="pixel.png"><style>.tile{background:url(pixel.png)}</style>',[image]);assert.equal((r.html.match(/data:image\/png;base64/g)||[]).length,2)});
test('browser smoke covers real asset decoding and CSS background',()=>{const s=readFileSync(new URL('./browser/run-smoke.mjs',import.meta.url),'utf8');assert.match(s,/await i\.decode\(\)/);assert.match(s,/getComputedStyle\(e\)\.backgroundImage/)});
