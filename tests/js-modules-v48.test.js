import test from 'node:test';
import assert from 'node:assert/strict';
import {bundleAssets,javascriptModuleDependencies} from '../src/asset-bundle.js';

const file=(name,content,path=name)=>({name,webkitRelativePath:path,size:new TextEncoder().encode(content).length,type:'text/javascript',text:async()=>content,arrayBuffer:async()=>new TextEncoder().encode(content).buffer});

test('discovers relative static, re-export and literal dynamic module imports',()=>{
 const code='import "./side.js"; import {value} from "../shared/value.js"; export {other} from "./other.mjs"; const lazy=()=>import("./lazy.js");';
 assert.deepEqual(javascriptModuleDependencies(code,'src/main.js'),['src/side.js','shared/value.js','src/other.mjs','src/lazy.js']);
});

test('recursively embeds JavaScript module graph and rewrites specifiers',async()=>{
 const files=[
  file('main.js',"import {answer} from './lib/value.js'; document.body.dataset.answer=answer;",'src/main.js'),
  file('value.js',"export const answer='42';",'src/lib/value.js')
 ];
 const result=await bundleAssets('<script type="module" src="src/main.js"></script>',files);
 assert.equal(result.missing.length,0);
 assert.equal(result.bundledFiles,2);
 assert.ok(result.html.includes('src="data:text/javascript;base64,'));
 const src=result.html.match(/src="([^"]+)"/)[1];
 const entry=atob(src.split(',')[1]);
 assert.ok(entry.includes('data:text/javascript;base64,'));
 assert.equal(result.bytes,files.reduce((n,f)=>n+f.size,0));
});

test('fails closed for missing nested JavaScript modules',async()=>{
 await assert.rejects(bundleAssets('<script type="module" src="main.js"></script>',[file('main.js',"import './missing.js';")]),error=>error.message==='Missing JavaScript asset: missing.js');
});

test('fails closed for non-literal dynamic imports',async()=>{
 await assert.rejects(bundleAssets('<script type="module" src="main.js"></script>',[file('main.js',"const path=getPath(); import(path);")]),/Non-literal dynamic import/);
});

test('rejects JavaScript module path traversal outside project root',()=>{
 assert.throws(()=>javascriptModuleDependencies("import '../escape.js';",'main.js'),/escapes project folder/);
});

test('fails clearly for local imports in inline module scripts',async()=>{
 await assert.rejects(bundleAssets('<script type="module">import "./inline.js";</script>',[file('inline.js',"export const value=1;")]),/Inline module imports cannot yet be bundled/);
});


test('rejects package-name module imports rather than shipping broken standalone games',async()=>{
 await assert.rejects(bundleAssets('<script type="module" src="main.js"></script>',[file('main.js',"import {x} from 'three'; console.log(x);")]),/Unsupported bare JavaScript module specifier.*three/);
});

test('rejects import-map aliases and preserves explicit relative module paths',()=>{
 assert.throws(()=>javascriptModuleDependencies("import '#engine';",'main.js'),/Unsupported bare JavaScript module specifier/);
 assert.deepEqual(javascriptModuleDependencies("import './engine.mjs';",'main.js'),['engine.mjs']);
});

test('remote module URLs are not mistaken for local files',()=>{
 assert.deepEqual(javascriptModuleDependencies("import 'https://cdn.example.com/lib.js';",'main.js'),[]);
});


test('ignores commented-out imports without missing-asset false alarms',async()=>{
 const code=`// import './missing.js';\n/* export {bad} from './absent.mjs'; */\nimport './real.js';`;
 assert.deepEqual(javascriptModuleDependencies(code,'main.js'),['real.js']);
 const result=await bundleAssets('<script type="module" src="main.js"></script>',[file('main.js',code),file('real.js','export const ok=true;')]);
 assert.equal(result.bundledFiles,2);
});

test('comment markers inside a quoted string do not hide subsequent imports',()=>{
 const code=`const url='https://example.org/path';\nimport './real.js';`;
 assert.deepEqual(javascriptModuleDependencies(code,'main.js'),['real.js']);
});


test('module-like text in ordinary strings is not a dependency',async()=>{
 const code=`const help = "import './ghost.js'"; const snippet = 'export {x} from "./fake.js"'; import './real.js';`;
 assert.deepEqual(javascriptModuleDependencies(code,'main.js'),['real.js']);
 const bundled=await bundleAssets('<script type="module" src="main.js"></script>',[file('main.js',code),file('real.js','export const ok=true;')]);
 assert.equal(bundled.bundledFiles,2);
});

test('dynamic-import-looking text in comments and strings does not fail the export',async()=>{
 const code=`// import(variable);\nconst hint = "import(variable)"; /* import(missing); */ export const ok=true;`;
 const bundled=await bundleAssets('<script type="module" src="main.js"></script>',[file('main.js',code)]);
 assert.equal(bundled.bundledFiles,1);
});

test('real variable dynamic imports still fail closed',async()=>{
 await assert.rejects(bundleAssets('<script type="module" src="main.js"></script>',[file('main.js','import(getName());')]),/Non-literal dynamic import/);
});
