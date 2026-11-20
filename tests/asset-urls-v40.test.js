import test from 'node:test';
import assert from 'node:assert/strict';
import {bundleAssets} from '../src/asset-bundle.js';
const file=name=>({name,size:2,type:'image/png',arrayBuffer:async()=>new TextEncoder().encode('ok').buffer});
test('replaces cache-busted quoted image paths',async()=>{const r=await bundleAssets('<img src="hero.png?v=4">',[file('hero.png')]);assert.match(r.html,/src="data:image\/png;base64,/);assert.doesNotMatch(r.html,/hero\.png\?v=4/)});
test('replaces fragment-suffixed local assets',async()=>{const r=await bundleAssets('<img src="hero.png#icon">',[file('hero.png')]);assert.match(r.html,/src="data:image\/png;base64,/)});
test('inlines unquoted CSS url reference',async()=>{const r=await bundleAssets('<style>.x{background:url(hero.png)}</style>',[file('hero.png')]);assert.match(r.html,/url\(data:image\/png;base64,/)});
test('inlines second srcset candidate',async()=>{const r=await bundleAssets('<img srcset="first.png 1x, hero.png 2x">',[file('hero.png'),file('first.png')]);assert.equal((r.html.match(/data:image\/png;base64/g)||[]).length,2)});
