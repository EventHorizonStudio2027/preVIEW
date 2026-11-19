import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
test('dedicated app icon appears in project tile',()=>assert.match(html,/project-thumb[^>]*><img src="assets\/brand\/app-icon\.png\?v=30"/));
test('favicon and Apple home screen icon are integrated',()=>{assert.match(html,/favicon\.png\?v=30/);assert.match(html,/apple-touch-icon\.png\?v=30/)});
test('brand images retain their aspect ratios',()=>assert.match(css,/v3\.0 brand fidelity:[^]*?\.hero-art \.art-play img\{[^}]*object-fit:contain/));
test('original white background remains intact',()=>assert.match(css,/\.project-thumb\{[^}]*background:#fff/));
