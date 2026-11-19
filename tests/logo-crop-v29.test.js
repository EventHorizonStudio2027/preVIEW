import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('white workspace remains the visual canvas',()=>assert.match(css,/\.hero-art \.art-play\{[^}]*background:#fff/));
test('wordmark keeps original image ratio',()=>assert.match(css,/aspect-ratio:1298 \/ 329/));
test('project icon uses its native landscape crop',()=>assert.match(css,/\.project-thumb img\{[^}]*width:86px;height:64px/));
test('logos have cache-refresh identifiers',()=>assert.match(html,/wordmark-light\.png\?v=29/));
