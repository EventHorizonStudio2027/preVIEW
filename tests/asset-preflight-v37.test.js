import test from 'node:test';
import assert from 'node:assert/strict';
import {planAssets,bundleAssets} from '../src/asset-bundle.js';
const file=(path,body='data')=>({name:path.split('/').at(-1),webkitRelativePath:path,size:body.length,type:'image/png',arrayBuffer:async()=>new TextEncoder().encode(body).buffer});
test('folder upload resolves nested asset path',()=>{const p=planAssets('<img src="sprites/hero.png">',[file('mygame/sprites/hero.png')]);assert.equal(p.matches.size,1);assert.equal(p.missing.length,0)});
test('preflight counts missing and matched assets',()=>{const p=planAssets('<img src="hero.png"><img src="missing.png">',[file('hero.png')]);assert.equal(p.matches.size,1);assert.deepEqual(p.missing,['missing.png']);assert.equal(p.bytes,4)});
test('duplicate paths are ambiguous',()=>{const p=planAssets('<img src="hero.png">',[file('hero.png'),file('hero.png')]);assert.deepEqual(p.ambiguous,['hero.png'])});
test('folder selection embeds asset and reports size',async()=>{const r=await bundleAssets('<img src="sprites/hero.png">',[file('game/sprites/hero.png')]);assert.equal(r.matched,1);assert.equal(r.bytes,4);assert.match(r.html,/data:image\/png;base64,/)});
test('preflight handles no local references',()=>{const p=planAssets('<p>OK</p>',[file('unused.png')]);assert.equal(p.requested,0);assert.equal(p.bytes,0)});
