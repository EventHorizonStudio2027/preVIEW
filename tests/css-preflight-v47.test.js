import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [html,app,styles]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/app.js',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);

test('review screen exposes an explicit nested asset preflight action',()=>{
  assert.match(html,/id="preflightAssets"/);
  assert.match(html,/id="nestedPreflightStatus"[^>]*aria-live="polite"/);
  assert.match(app,/\$\('preflightAssets'\)\.onclick=async\(\)=>/);
});

test('preflight uses the same recursive bundler as playable export',()=>{
  assert.match(app,/const bundle=await bundleAssets\(importedHtml,\[\.\.\.assetFiles,\.\.\.assetFolderFiles\]\)/);
  assert.match(app,/Unresolved dependencies:/);
  assert.match(app,/Nested CSS dependencies were resolved/);
});

test('changing selected assets invalidates stale preflight feedback',()=>{
  assert.match(app,/Selected files changed\. Run preflight again before exporting\./);
  assert.match(styles,/nested-preflight-actions/);
});
