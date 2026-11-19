import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
test('first-run demo CTA is present and clearly labeled',()=>assert.match(html,/id="emptyDemo"[^>]*>Try the playable demo/));
test('first-run CTA delegates to existing demo loader',()=>assert.match(js,/\$\('emptyDemo'\)\.onclick=\(\)=>\$\('loadDemo'\)\.click\(\)/));
test('first-run CTA has visible keyboard focus',()=>assert.match(css,/\.empty-demo-button:focus-visible/));
