import test from 'node:test';
import assert from 'node:assert/strict';
import {createMoment,playbackPlan,validateProject,manifest} from '../src/model.js';
const project=()=>({name:'Test',moments:[{...createMoment('Start','hook',0),checkpoint:{x:1},durationSeconds:5},{...createMoment('Finish','finale',12),checkpoint:{x:2},durationSeconds:12}]});
test('per-moment durations override defaults and produce cumulative offsets',()=>{const p=playbackPlan(project(),8);assert.deepEqual(p.map(x=>[x.offsetSeconds,x.durationSeconds]),[[0,5],[5,12]])});
test('legacy moments fall back to chosen default',()=>{const p=project();delete p.moments[0].durationSeconds;assert.equal(playbackPlan(p,20)[0].durationSeconds,20)});
test('invalid durations rejected',()=>{for(const durationSeconds of [-1,0,2,31,3.5,Infinity]){const p=project();p.moments[0].durationSeconds=durationSeconds;assert.throws(()=>validateProject(p))}});
test('manifest preserves configured durations',()=>{assert.deepEqual(manifest(project()).moments.map(m=>m.durationSeconds),[5,12])});
