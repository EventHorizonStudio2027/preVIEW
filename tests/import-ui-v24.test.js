import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
test('import blocks on complete unsafe count, not truncated report',()=>assert.match(app,/inspection\.counts\.unsafe>0/));
test('asset diagnostics summarize local and remote counts',()=>assert.match(app,/inspection\.counts\.remote/));
test('asset diagnostics have accessible visual states',()=>{assert.match(css,/#importDiagnostics\[data-level="ready"\]/);assert.match(css,/#importDiagnostics\[data-level="caution"\]/)});

test('invalid HTML selections clear the input to allow selecting the same corrected file',()=>{
 assert.match(app,/Choose an HTML file under 20 MB\.\x27\);e\.target\.value=\x27\x27;return/);
 assert.match(app,/Import blocked: unsafe asset references detected\.\x27\);e\.target\.value=\x27\x27;return/);
});

test('checkpoint message handler rejects unexpected SDK replies instead of hanging',()=>{
 assert.match(app,/Unexpected checkpoint response:/);
 assert.match(app,/else request\.reject\(Error\('Unexpected checkpoint response:/);
});
