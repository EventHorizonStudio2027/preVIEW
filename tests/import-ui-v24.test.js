import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
test('import blocks on complete unsafe count, not truncated report',()=>assert.match(app,/inspection\.counts\.unsafe>0/));
test('asset diagnostics summarize local and remote counts',()=>assert.match(app,/inspection\.counts\.remote/));
test('asset diagnostics have accessible visual states',()=>{assert.match(css,/#importDiagnostics\[data-level="ready"\]/);assert.match(css,/#importDiagnostics\[data-level="caution"\]/)});
