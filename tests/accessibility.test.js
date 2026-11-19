import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/accessibility.css',import.meta.url),'utf8');
test('keyboard users can skip navigation',()=>{assert.match(html,/class="skip-link" href="#overview"/);assert.match(css,/\.skip-link:focus/)});
test('workspace has a programmatic focus target',()=>assert.match(html,/id="workspace-main" tabindex="-1"/));
test('visible focus and reduced-motion rules exist',()=>{assert.match(css,/:focus-visible/);assert.match(css,/prefers-reduced-motion:reduce/)});