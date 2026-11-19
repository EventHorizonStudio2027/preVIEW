import test from 'node:test';
import assert from 'node:assert/strict';
import {bundleAssets} from '../src/asset-bundle.js';
const file=(path)=>({name:path.split('/').at(-1),webkitRelativePath:path,size:2,type:'image/png',arrayBuffer:async()=>new TextEncoder().encode('ok').buffer});
test('exact path wins over same basename in other folders',async()=>{const r=await bundleAssets('<img src="a/logo.png">',[file('b/a/logo.png'),file('a/logo.png')]);assert.equal(r.matched,1);assert.equal(r.missing.length,0)});
test('ambiguous suffix matches fail closed instead of guessing',async()=>{const r=await bundleAssets('<img src="logo.png">',[file('a/logo.png'),file('b/logo.png')]);assert.equal(r.matched,0);assert.match(r.missing[0],/ambiguous/)});
test('srcset first asset reference can be inlined',async()=>{const r=await bundleAssets('<img srcset="logo.png 1x">',[file('logo.png')]);assert.match(r.html,/data:image\/png;base64,/)});
