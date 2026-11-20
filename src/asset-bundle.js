import {inspectHtml} from './import-check.js';
export const MAX_BUNDLE_BYTES=30*1024*1024;
const safePath=p=>{try{const d=decodeURIComponent(p.split(/[?#]/)[0]);if(!d||d.startsWith('/')||d.includes('\\')||d.split('/').some(x=>x==='..')||/^[a-z]+:/i.test(d))return null;return d.replace(/^\.\//,'')}catch{return null}};
export function assetPaths(source){const report=inspectHtml(source,'game.html');if(report.totalReferences>report.references.length)throw Error('Too many asset references to safely bundle.');return [...new Set(report.references.filter(x=>x.kind==='local').map(x=>safePath(x.path)).filter(Boolean))]}
export function planAssets(source,files){
 const paths=assetPaths(source);
 const map=new Map();
 for(const file of files){const path=safePath(file.webkitRelativePath||file.name);if(path){const group=map.get(path)||[];group.push(file);map.set(path,group)}}
 const matches=new Map(),missing=[],ambiguous=[];
 for(const path of paths){
  const exact=map.get(path)||[];
  const suffix=[...map.keys()].filter(k=>k.endsWith('/'+path)).flatMap(k=>map.get(k));
  const candidates=exact.length?exact:suffix;
  if(candidates.length>1){ambiguous.push(path);continue}
  if(!candidates.length){missing.push(path);continue}
  matches.set(path,candidates[0]);
 }
 const bytes=[...new Set(matches.values())].reduce((total,file)=>total+file.size,0);
 return {matches,missing,ambiguous,bytes,requested:paths.length,overLimit:bytes>MAX_BUNDLE_BYTES};
}
export async function bundleAssets(source,files){
 const plan=planAssets(source,files);
 if(plan.bytes>MAX_BUNDLE_BYTES)throw Error('Selected assets exceed the 30 MB bundle limit.');
 const replacements=new Map();
 for(const [path,file] of plan.matches){
  const buffer=await file.arrayBuffer();const arr=new Uint8Array(buffer);let raw='';
  for(let i=0;i<arr.length;i+=8192)raw+=String.fromCharCode(...arr.subarray(i,i+8192));
  const type=file.type||'application/octet-stream';
  replacements.set(path,'data:'+type+';base64,'+btoa(raw));
 }
 let html=source;
 for(const [path,data] of replacements){
  for(const prefix of ['', './']){
   const target=prefix+path;
   const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   const escaped=escapeRegExp(target);
   const quoted=new RegExp('(["\\x27])'+escaped+'([?#][^"\\x27\\s]*)?\\1','g');
   html=html.replace(quoted,(_all,quote,suffix='')=>quote+data+suffix+quote);
   const srcset=new RegExp('(["\\x27,]\\s*)'+escaped+'([?#][^\\s,"\\x27]*)?(\\s+\\d+(?:\\.\\d+)?[wx])','g');
   html=html.replace(srcset,(_all,lead,suffix='',descriptor)=>lead+data+suffix+descriptor);
   const css=new RegExp('(url\\(\\s*)'+escaped+'([?#][^\\s)]*)?(\\s*\\))','gi');
   html=html.replace(css,(_all,lead,suffix='',end)=>lead+data+suffix+end);
  }
 }
 return {html,matched:replacements.size,missing:[...plan.missing,...plan.ambiguous.map(x=>x+' (ambiguous)')],bytes:plan.bytes};
}
