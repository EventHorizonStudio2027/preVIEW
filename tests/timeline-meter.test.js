import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
test('timeline utilization has accessible progress semantics',()=>{assert.match(html,/role="progressbar"[^>]+aria-label="Timeline duration used"/);assert.match(html,/id="timelineMeterFill"/)});
test('meter is updated from actual sequence duration',()=>{assert.match(js,/summary\.totalSeconds\/summary\.targetSeconds/);assert.match(js,/aria-valuetext/)});
test('meter indicates over-budget and reduced motion',()=>{assert.match(css,/timeline-meter\.over-budget/);assert.match(css,/prefers-reduced-motion:reduce/)});
