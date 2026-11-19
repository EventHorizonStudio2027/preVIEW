import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/timeline-polish.css',import.meta.url),'utf8');
test('project status accurately describes local-only draft',()=>{assert.match(html,/Local draft/);assert.match(html,/not hosted or published/)});
test('local status indicator is decorative and responsive',()=>{assert.match(html,/status-indicator" aria-hidden="true"/);assert.match(css,/\.project-status/)});