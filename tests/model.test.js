import test from 'node:test';import assert from 'node:assert/strict';import {createMoment,moveMoment,validateDestination,validateProject,manifest} from '../src/model.js';
if(!globalThis.crypto)globalThis.crypto=(await import('node:crypto')).webcrypto;
test('moment creation normalizes values',()=>{const m=createMoment(' Boss fight ','wow',2.345);assert.equal(m.title,'Boss fight');assert.equal(m.atSeconds,2.3)});
test('moment validation rejects malformed input',()=>{assert.throws(()=>createMoment('','hook',1));assert.throws(()=>createMoment('x','unknown',1));assert.throws(()=>createMoment('x','hook',-1))});
test('reordering does not mutate original',()=>{const a=[{id:'a'},{id:'b'}];const b=moveMoment(a,'b',-1);assert.deepEqual(b.map(x=>x.id),['b','a']);assert.equal(a[0].id,'a')});
test('destination URL blocks javascript',()=>{assert.equal(validateDestination('javascript:alert(1)'),null);assert.equal(validateDestination(''), '');assert.equal(validateDestination('https://example.com'),'https://example.com/')});
test('project rejects invalid moments',()=>{assert.throws(()=>validateProject({moments:[{title:'x',type:'hook',atSeconds:-3}]}))});
test('manifest has accurate limitations and brand',()=>{const m=manifest({name:'Demo',moments:[createMoment('Start','hook',1)],ctaUrl:'https://example.com',ctaText:'Try it'});assert.equal(m.product,'preVIEW');assert.equal(m.moments.length,1);assert.equal(m.capabilities.restorableCheckpoints,false)});
test('manifest rejects unsafe CTA',()=>assert.throws(()=>manifest({moments:[],ctaUrl:'data:text/html,hi'})));
