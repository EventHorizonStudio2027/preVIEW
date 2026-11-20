import test from 'node:test';
import assert from 'node:assert/strict';
import {bundleAssets,stylesheetDependencies} from '../src/asset-bundle.js';
const file=(name,content,path='')=>({name,webkitRelativePath:path,size:content.length,type:name.endsWith('.css')?'text/css':'image/png',text:async()=>content,arrayBuffer:async()=>new TextEncoder().encode(content).buffer});
test('resolves CSS image and relative parent paths',()=>assert.deepEqual(stylesheetDependencies('a{background:url(../img/hero.png)}','css/main.css'),['img/hero.png']));
test('resolves nested stylesheet imports',()=>assert.deepEqual(stylesheetDependencies('@import "parts/theme.css";','css/main.css'),['css/parts/theme.css']));
test('rejects CSS paths escaping project root',()=>assert.throws(()=>stylesheetDependencies('a{background:url(../../outside.png)}','css/main.css'),/escapes/));
test('bundles a CSS file with an image dependency',async()=>{const r=await bundleAssets('<link href="main.css" rel="stylesheet">',[file('main.css','a{background:url(hero.png)}'),file('hero.png','123')]);assert.equal(r.missing.length,0);assert.match(r.html,/data:text\/css;base64,/);const encoded=r.html.match(/data:text\/css;base64,([^"']+)/)[1];assert.match(atob(encoded),/data:image\/png;base64,/);assert.equal(r.bytes,'a{background:url(hero.png)}'.length+3)});
test('fails safely on missing nested CSS dependency',async()=>{await assert.rejects(bundleAssets('<link href="main.css">',[file('main.css','a{background:url(missing.png)}')]),/Missing CSS asset/)});
test('fails safely on circular CSS imports',async()=>{await assert.rejects(bundleAssets('<link href="a.css">',[file('a.css','@import "b.css";'),file('b.css','@import "a.css";')]),/Circular stylesheet/)});

test('CSS bundling does not rewrite unrelated quoted text',async()=>{
 const css='a::before{content:"hero.png"}a{background:url(hero.png)}';
 const r=await bundleAssets('<link href="main.css" rel="stylesheet">',[file('main.css',css),file('hero.png','123')]);
 const encoded=r.html.match(/data:text\/css;base64,([^"']+)/)[1];
 const rewritten=atob(encoded);
 assert.match(rewritten,/content:"hero\.png"/);
 assert.match(rewritten,/background:url\(data:image\/png;base64,/);
});

test('CSS bundling handles repeated references without touching plain text',async()=>{
 const css='a{background:url(hero.png)}b{background:url(hero.png)}c::before{content:"hero.png"}';
 const r=await bundleAssets('<link href="main.css">',[file('main.css',css),file('hero.png','123')]);
 const rewritten=atob(r.html.match(/data:text\/css;base64,([^"']+)/)[1]);
 assert.equal((rewritten.match(/data:image\/png;base64,/g)||[]).length,2);
 assert.match(rewritten,/content:"hero\.png"/);
});

test('CSS comments do not request missing assets',async()=>{
 const css='/* background:url(missing.png) */ a{background:url(hero.png)}';
 const r=await bundleAssets('<link href="main.css">',[file('main.css',css),file('hero.png','123')]);
 assert.equal(r.bundledFiles,2);
});

test('CSS comments do not create false circular imports',async()=>{
 const css='/* @import "main.css"; */ a{color:red}';
 const r=await bundleAssets('<link href="main.css">',[file('main.css',css)]);
 assert.equal(r.bundledFiles,1);
});

test('CSS comment markers inside quoted content do not hide real asset references',async()=>{
 const css='a::before{content:"/* not a comment */"}a{background:url(hero.png)}';
 const r=await bundleAssets('<link href="main.css">',[file('main.css',css),file('hero.png','123')]);
 assert.equal(r.bundledFiles,2);
 const rewritten=atob(r.html.match(/data:text\/css;base64,([^"']+)/)[1]);
 assert.match(rewritten,/content:"\/\* not a comment \*\/"/);
 assert.match(rewritten,/data:image\/png;base64,/);
});

test('CSS escaped quote does not cause comment masking',async()=>{
 const css=String.raw`a::before{content:"quoted \" /* text */"}a{background:url(hero.png)}`;
 const r=await bundleAssets('<link href="main.css">',[file('main.css',css),file('hero.png','123')]);
 assert.equal(r.bundledFiles,2);
});
