import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectHtml} from '../src/import-check.js';
test('self-contained HTML is compatible',()=>assert.equal(inspectHtml('<html><img src="data:image/png;base64,abc"></html>').compatible,true));
test('local assets are detected',()=>{const r=inspectHtml('<script src="js/main.js"></script><img src="assets/a.png">');assert.equal(r.compatible,false);assert.equal(r.references.filter(x=>x.kind==='local').length,2)});
test('remote references get warning',()=>assert.match(inspectHtml('<script src="https://cdn.example/x.js"></script>').warnings.join(' '),/Remote assets/));
test('unsafe schemes rejected',()=>assert.equal(inspectHtml('<script src="javascript:alert(1)"></script>').compatible,false));
test('sdk registration detected',()=>assert.equal(inspectHtml('<script>preVIEW.register({capture(){},restore(){}})</script>').sdkDetected,true));
test('invalid extension rejected',()=>assert.throws(()=>inspectHtml('', 'game.exe'),/HTML file/));