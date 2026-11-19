import test from 'node:test';
import assert from 'node:assert/strict';
import {creatorProgress} from '../src/workflow.js';
test('empty project has three incomplete steps',()=>assert.deepEqual(creatorProgress({}).map(x=>x.done),[false,false,false]));
test('import alone completes first step',()=>assert.deepEqual(creatorProgress({fileName:'game.html'}).map(x=>x.done),[true,false,false]));
test('moments alone do not mark review complete',()=>assert.deepEqual(creatorProgress({moments:[{}],ctaUrl:'https://example.com'}).map(x=>x.done),[false,true,false]));
test('all three complete with imported game, moment and destination',()=>assert.deepEqual(creatorProgress({fileName:'game.html',moments:[{}],ctaUrl:'https://example.com'}).map(x=>x.done),[true,true,true]));
test('malformed destination does not mark review complete',()=>assert.equal(creatorProgress({fileName:'g.html',moments:[{}],ctaUrl:'https://'}).at(-1).done,false));
