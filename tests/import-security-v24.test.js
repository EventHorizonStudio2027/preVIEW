import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectHtml} from '../src/import-check.js';
test('unsafe reference beyond 100-item report remains counted',()=>{
 const report=inspectHtml('<img src="safe.png">'.repeat(101)+'<img src="javascript:alert(1)">');
 assert.equal(report.references.length,100);
 assert.equal(report.counts.unsafe,1);
 assert.equal(report.canImport,false);
});
test('encoded parent traversal is unsafe',()=>assert.equal(inspectHtml('<img src="%2e%2e/private.png">').counts.unsafe,1));
test('backslash traversal is unsafe',()=>assert.equal(inspectHtml('<img src="..\\secret.png">').counts.unsafe,1));
test('encoded javascript scheme is unsafe',()=>assert.equal(inspectHtml('<img src="javascript%3Aalert(1)">').counts.unsafe,1));
test('safe inline image remains importable',()=>assert.equal(inspectHtml('<img src="data:image/png;base64,AA">').canImport,true));
