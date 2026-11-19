import test from 'node:test';
import assert from 'node:assert/strict';
import {creatorProgress} from '../src/workflow.js';
test('empty project has three incomplete steps',()=>assert.deepEqual(creatorProgress({}).map(x=>x.done),[false,false,false]));
test('import alone completes first step',()=>assert.deepEqual(creatorProgress({fileName:'game.html'}).map(x=>x.done),[true,false,false]));
test('moments without imported game are not marked complete',()=>assert.deepEqual(creatorProgress({moments:[{}],ctaUrl:'https://example.com'}).map(x=>x.done),[false,false,false]));
test('all three complete with imported game, moment and destination',()=>assert.deepEqual(creatorProgress({fileName:'game.html',moments:[{}],ctaUrl:'https://example.com'}).map(x=>x.done),[true,true,true]));
test('malformed destination does not mark review complete',()=>assert.equal(creatorProgress({fileName:'g.html',moments:[{}],ctaUrl:'https://'}).at(-1).done,false));

test('browser history navigation listener is registered',async()=>{const {readFileSync}=await import('node:fs');const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');assert.match(app,/addEventListener\('hashchange'/)});

test('URL containing whitespace is rejected for review',()=>assert.equal(creatorProgress({fileName:'g.html',moments:[{}],ctaUrl:'https://bad host.example'}).at(-1).done,false));
test('unsupported URL scheme is rejected for review',()=>assert.equal(creatorProgress({fileName:'g.html',moments:[{}],ctaUrl:'javascript:alert(1)'}).at(-1).done,false));
test('valid HTTP destination remains accepted',()=>assert.equal(creatorProgress({fileName:'g.html',moments:[{}],ctaUrl:'http://example.com'}).at(-1).done,true));
test('current step exposed to assistive technology',async()=>{const {readFileSync}=await import('node:fs');const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');assert.match(app,/setAttribute\('aria-current','step'\)/)});
