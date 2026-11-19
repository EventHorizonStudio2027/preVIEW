import test from 'node:test';
import assert from 'node:assert/strict';
import {playbackPlan} from '../src/model.js';
const project={moments:[{title:'Boss',type:'wow',atSeconds:12,checkpoint:{hp:2}},{title:'Intro',type:'hook',atSeconds:1,checkpoint:{hp:9}}]};
test('playback follows creator order, not capture timestamps',()=>{const p=playbackPlan(project,5);assert.deepEqual(p.map(x=>x.title),['Boss','Intro']);assert.deepEqual(p.map(x=>x.offsetSeconds),[0,5]);assert.deepEqual(p.map(x=>x.durationSeconds),[5,5])});
test('playback requires complete checkpoints',()=>{assert.throws(()=>playbackPlan({moments:[{...project.moments[0],checkpoint:null}]}),/1/)});
test('playback rejects invalid durations',()=>{for(const n of [0,2,31,4.5,NaN])assert.throws(()=>playbackPlan(project,n));assert.equal(playbackPlan(project,30).length,2)});
test('playback does not mutate checkpoint data',()=>{const before=JSON.stringify(project);playbackPlan(project,8);assert.equal(JSON.stringify(project),before)});
