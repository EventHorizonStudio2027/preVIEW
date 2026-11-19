import test from 'node:test';
import assert from 'node:assert/strict';
import {createMoment,walkthroughReadiness,walkthroughStep} from '../src/model.js';
if(!globalThis.crypto)globalThis.crypto=(await import('node:crypto')).webcrypto;
test('empty walkthrough cannot start',()=>{assert.equal(walkthroughReadiness({moments:[]}).ready,false)});
test('missing checkpoints reported with one-based indices',()=>{const a=createMoment('Intro','hook',1),b=createMoment('Boss','wow',8);a.checkpoint={hp:10};assert.deepEqual(walkthroughReadiness({moments:[a,b]}).missing,[2]);assert.throws(()=>walkthroughStep({moments:[a,b]},0),/2/)});
test('walkthrough returns checkpoint in creator order',()=>{const a=createMoment('Intro','hook',1),b=createMoment('Boss','wow',8);a.checkpoint={hp:10};b.checkpoint={hp:3};const project={moments:[b,a]};assert.equal(walkthroughReadiness(project).ready,true);assert.deepEqual(walkthroughStep(project,0).state,{hp:3});assert.equal(walkthroughStep(project,1).title,'Intro');assert.throws(()=>walkthroughStep(project,2))});