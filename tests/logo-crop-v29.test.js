import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('white workspace remains the visual canvas',()=>assert.match(css,/\.hero-art \.art-play\{[^}]*background:#fff/));
test('wordmark keeps original image ratio',()=>assert.match(css,/aspect-ratio:1298 \/ 329/));
test('project icon uses a dedicated square image',()=>assert.match(css,/\.project-thumb img\{[^}]*width:66px;height:66px/));
test('logos have cache-refresh identifiers',()=>assert.match(html,/wordmark-light\.png\?v=30/));
