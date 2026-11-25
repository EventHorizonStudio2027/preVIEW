import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
test('import blocks on complete unsafe count, not truncated report',()=>assert.match(app,/inspection\.counts\.unsafe>0/));
test('asset diagnostics summarize local and remote counts',()=>assert.match(app,/inspection\.counts\.remote/));
test('asset diagnostics have accessible visual states',()=>{assert.match(css,/#importDiagnostics\[data-level="ready"\]/);assert.match(css,/#importDiagnostics\[data-level="caution"\]/)});

test('invalid HTML selections clear the input to allow selecting the same corrected file',()=>{
 assert.match(app,/Choose a non-empty HTML file under 20 MB\.\x27\);e\.target\.value=\x27\x27;return/);
 assert.match(app,/Import blocked: unsafe asset references detected\.\x27\);e\.target\.value=\x27\x27;return/);
});

test('checkpoint message handler rejects unexpected SDK replies instead of hanging',()=>{
 assert.match(app,/Unexpected checkpoint response:/);
 assert.match(app,/else request\.reject\(Error\('Unexpected checkpoint response:/);
});

test('new game imports and demo selection invalidate stale asynchronous file reads',()=>{
 assert.match(app,/let importGeneration=0/);
 assert.match(app,/const generation=\+\+importGeneration/);
 assert.match(app,/html=await file\.text\(\);if\(generation!==importGeneration\)return/);
 assert.match(app,/function clearGame\(\)\{importGeneration\+\+;/);
 assert.match(app,/\$\('loadDemo'\)\.onclick=\(\)=>\{clearGame\(\)/);
 assert.match(app,/const contents=await file\.text\(\);if\(generation!==importGeneration\)return/);
});

test('SDK handshake retries are scoped to their own game session',()=>{
 assert.match(app,/token=sessionToken;let attempts=0/);
 assert.match(app,/if\(token!==sessionToken\|\|sdkReady\)return/);
 assert.match(app,/Checkpoint SDK: no response from app/);
});
test('outdated backup reads cannot reset newer selections or show stale errors',()=>{
 assert.match(app,/if\(generation===importGeneration\)notify\('Could not restore project:/);
 assert.match(app,/if\(generation===importGeneration\)e\.target\.value=''/);
});

test('empty HTML uploads are rejected without discarding the current game',()=>{
 assert.match(app,/file\.size===0\|\|file\.size>20\*1024\*1024/);
 assert.match(app,/Choose a non-empty HTML file under 20 MB/);
});

test('checkpoint capture is locked to the original game, project, and selected moment',()=>{
 assert.match(app,/if\(checkpointCapturing\)return/);
 assert.match(app,/const token=sessionToken,project=state,target=\$\('checkpointTarget'\)\.value/);
 assert.match(app,/if\(token!==sessionToken\|\|project!==state\)return/);
 assert.match(app,/\$\('captureCheckpoint'\)\.disabled=!sdkReady/);
});
