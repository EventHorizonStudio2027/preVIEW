import {inspectHtml} from './import-check.js';
const LIMIT=30*1024*1024;
const safePath=p=>{try{const d=decodeURIComponent(p.split(/[?#]/)[0]);if(!d||d.startsWith('/')||d.includes('\\')||d.split('/').some(x=>x==='..')||/^[a-z]+:/i.test(d))return null;return d.replace(/^\.\//,'')}catch{return null}};
export function assetPaths(source){const report=inspectHtml(source,'game.html');if(report.totalReferences>report.references.length)throw Error('Too many asset references to safely bundle.');return [...new Set(report.references.filter(x=>x.kind==='local').map(x=>safePath(x.path)).filter(Boolean))]}
export async function bundleAssets(source,files){
 const paths=assetPaths(source);if(!paths.length)return {html:source,matched:0,missing:[],bytes:0};
 const map=new Map();for(const file of files){const path=safePath(file.webkitRelativePath||file.name);if(path)map.set(path,file)}
 const replacements=new Map();let bytes=0;const missing=[];
 for(const path of paths){const file=map.get(path)||map.get([...map.keys()].find(k=>k.endsWith('/'+path)));if(!file){missing.push(path);continue}bytes+=file.size;if(bytes>LIMIT)throw Error('Selected assets exceed the 30 MB bundle limit.');const buffer=await file.arrayBuffer();const arr=new Uint8Array(buffer);let raw='';for(let i=0;i<arr.length;i+=8192)raw+=String.fromCharCode(...arr.subarray(i,i+8192));const type=file.type||'application/octet-stream';replacements.set(path,'data:'+type+';base64,'+btoa(raw))}
 let html=source;for(const [path,data] of replacements){const escaped=path.replace(/[.*+?^$()|[\]{}\\]/g,'\\$&');const re=new RegExp('(?<=["\\x27(])(?:\\./)?'+escaped+'(?=["\\x27)?])','g');html=html.replace(re,data)}
 return {html,matched:replacements.size,missing,bytes};
}
