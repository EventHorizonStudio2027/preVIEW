import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('sidebar uses approved preVIEW wordmark',()=>assert.match(html,/brand-wordmark[^>]*wordmark-light\.png/));
test('hero and empty state use actual brand mark',()=>assert.equal((html.match(/src="assets\/brand\/brand-mark\.png(?:\?v=\d+)?"/g)||[]).length,2));
test('no placeholder SVG used in visible workspace',()=>assert.doesNotMatch(html,/src="assets\/brand\/mark\.svg"/));
test('brand artwork exists',()=>{for(const name of ['wordmark-light.png','brand-mark.png','app-icon.png','favicon.png','apple-touch-icon.png'])assert.ok(statSync(new URL('../assets/brand/'+name,import.meta.url)).size>1000)});
