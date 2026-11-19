import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
test('manifest download disabled until readiness passes',()=>assert.match(app,/\$\('exportManifest'\)\.disabled=!check\.ready/));
test('export guard remains active even if button is triggered directly',()=>assert.match(app,/if\(!check\.ready\)\{notify\('Review the readiness checklist/));
test('pages workflow deploys only stable main branch',()=>assert.match(workflow,/branches: \[main\]/));
test('pages workflow has scoped permissions',()=>{assert.match(workflow,/pages: write/);assert.match(workflow,/id-token: write/)});
