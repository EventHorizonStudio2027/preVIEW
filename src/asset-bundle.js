import {inspectHtml} from './import-check.js';
export const MAX_BUNDLE_BYTES=30*1024*1024;
const MIME_BY_EXTENSION={js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',avif:'image/avif',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',mp4:'video/mp4',webm:'video/webm',wasm:'application/wasm'};
export function assetMimeType(file,path){const supplied=(file.type||'').trim().toLowerCase();if(supplied&&supplied!=='application/octet-stream')return supplied;const ext=path.split('.').pop().toLowerCase();return MIME_BY_EXTENSION[ext]||'application/octet-stream'};
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
 const replacements=new Map();const encodedFiles=new Map();
 for(const [path,file] of plan.matches){
  let encoded=encodedFiles.get(file);
  if(!encoded){const buffer=await file.arrayBuffer();const arr=new Uint8Array(buffer);if(arr.byteLength>MAX_BUNDLE_BYTES)throw Error('Asset exceeds the 30 MB bundle limit.');let raw='';for(let i=0;i<arr.length;i+=8192)raw+=String.fromCharCode(...arr.subarray(i,i+8192));encoded=btoa(raw);encodedFiles.set(file,encoded)}
  replacements.set(path,'data:'+assetMimeType(file,path)+';base64,'+encoded);
 }
 let html=source;
 for(const [path,data] of replacements){
  for(const prefix of ['', './']){
   const target=prefix+path;
   const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   const escaped=escapeRegExp(target);
   const quoted=new RegExp('(["\\x27])'+escaped+'([?#][^"\\x27\\s]*)?\\1','g');
   html=html.replace(quoted,(_all,quote,suffix='')=>quote+data+quote);
   const srcset=new RegExp('(["\\x27,]\\s*)'+escaped+'([?#][^\\s,"\\x27]*)?(\\s+\\d+(?:\\.\\d+)?[wx])','g');
   html=html.replace(srcset,(_all,lead,suffix='',descriptor)=>lead+data+descriptor);
   // Unquoted HTML references were detected by import-check but previously left unchanged.
   // Restrict replacements to asset-bearing attributes rather than arbitrary text.
   const unquoted=new RegExp('(\\\\b(?:src|href|poster|data)\\\\s*=\\\\s*)'+escaped+'([?#][^\\\\s>"\\x27]*)?(?=[\\\\s>])','gi');
   html=html.replace(unquoted,(_all,lead)=>lead+data);
   const css=new RegExp('(url\\(\\s*)'+escaped+'([?#][^\\s)]*)?(\\s*\\))','gi');
   html=html.replace(css,(_all,lead,suffix='',end)=>lead+data+end);
  }
 }
 return {html,matched:replacements.size,missing:[...plan.missing,...plan.ambiguous.map(x=>x+' (ambiguous)')],bytes:plan.bytes};
}
