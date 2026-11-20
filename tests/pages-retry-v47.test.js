import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
test('Pages artifact names are unique per workflow attempt',()=>{
  const name='github-pages-${{ github.run_attempt }}';
  assert.match(workflow,/name: github-pages-\$\{\{ github\.run_attempt \}\}/);
  assert.match(workflow,/artifact_name: github-pages-\$\{\{ github\.run_attempt \}\}/);
});
