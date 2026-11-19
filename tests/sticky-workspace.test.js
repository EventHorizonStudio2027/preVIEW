import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
test('workspace header remains visible during editing',()=>assert.match(css,/\.topbar\{position:sticky;top:0/));
test('sticky header has a reduced transparency fallback',()=>assert.match(css,/prefers-reduced-transparency:reduce/));
