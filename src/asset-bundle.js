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
  const candidates=[...new Set(exact.length?exact:suffix)];
  if(candidates.length>1){ambiguous.push(path);continue}
  if(!candidates.length){missing.push(path);continue}
  matches.set(path,candidates[0]);
 }
 const bytes=[...new Set(matches.values())].reduce((total,file)=>total+file.size,0);
 return {matches,missing,ambiguous,bytes,requested:paths.length,overLimit:bytes>MAX_BUNDLE_BYTES};
}
// Resolve stylesheet dependencies relative to the stylesheet's own directory.
const cssRefs=css=>[...css.matchAll(/url\(\s*(?:["']([^"']+)["']|([^\s)]+))\s*\)|@import\s+["']([^"']+)["']/gi)].map(m=>m[1]||m[2]||m[3]).filter(Boolean);
const cssLocal=ref=>!ref.startsWith('#')&&!/^(?:data:|blob:|https?:|\/\/)/i.test(ref);
const cssResolve=(base,ref)=>{const raw=ref.split(/[?#]/)[0];let decoded;try{decoded=decodeURIComponent(raw)}catch{throw Error('Invalid encoded CSS asset path: '+ref)}if(decoded.startsWith('/')||decoded.includes('\\'))throw Error('Unsafe CSS asset path: '+ref);const parts=base.split('/').slice(0,-1);for(const segment of decoded.split('/')){if(segment==='.'||!segment)continue;if(segment==='..'){if(!parts.length)throw Error('CSS asset escapes project folder: '+ref);parts.pop()}else parts.push(segment)}return parts.join('/')};
export function stylesheetDependencies(css,base){return [...new Set(cssRefs(css).filter(cssLocal).map(ref=>cssResolve(base,ref)))]}
const jsModuleRefs=source=>{
 const found=[];
 const patterns=[
  /\bimport\s*(['"])([^'"]+)\1/g,
  /\bimport\s+[\s\S]*?\s+from\s*(['"])([^'"]+)\1/g,
  /\bexport\s+(?:\*|\{[\s\S]*?\})\s+from\s*(['"])([^'"]+)\1/g,
  /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g
 ];
 for(const pattern of patterns)for(const match of source.matchAll(pattern)){
  const ref=match[2],offset=match.index+match[0].lastIndexOf(ref);
  found.push({ref,start:offset});
 }
 return [...new Map(found.map(item=>[item.start,item])).values()].sort((a,b)=>a.start-b.start);
};
const jsLocal=ref=>!ref.startsWith('#')&&!/^(?:data:|blob:|https?:|\/\/)/i.test(ref);
const jsExternal=ref=>/^(?:data:|blob:|https?:|\/\/)/i.test(ref);
const validateModuleRef=(ref,base)=>{if(ref.startsWith('#')||(!ref.startsWith('./')&&!ref.startsWith('../')&&!jsExternal(ref)))throw Error('Unsupported bare JavaScript module specifier in '+base+': '+ref+'. Use a relative .js/.mjs path; import maps and package names are not portable yet.');};
const jsResolve=(base,ref)=>{const raw=ref.split(/[?#]/)[0];let decoded;try{decoded=decodeURIComponent(raw)}catch{throw Error('Invalid encoded JavaScript module path: '+ref)}if(decoded.startsWith('/')||decoded.includes('\\'))throw Error('Unsafe JavaScript module path: '+ref);const parts=base.split('/').slice(0,-1);for(const segment of decoded.split('/')){if(segment==='.'||!segment)continue;if(segment==='..'){if(!parts.length)throw Error('JavaScript module escapes project folder: '+ref);parts.pop()}else parts.push(segment)}return parts.join('/')};
export function javascriptModuleDependencies(source,base){return [...new Set(jsModuleRefs(source).map(m=>{validateModuleRef(m.ref,base);return m.ref}).filter(jsLocal).map(ref=>jsResolve(base,ref)))]}
export async function bundleAssets(source,files){
 for(const script of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!/\btype\s*=\s*(['"])module\1/i.test(script[1])||/\bsrc\s*=/i.test(script[1]))continue;
  const body=script[2];
  if(/\bimport\s*\(\s*(?!['"])/.test(body))throw Error('Inline module contains a non-literal dynamic import and cannot be bundled safely.');
  if(jsModuleRefs(body).some(match=>jsLocal(match.ref)))throw Error('Inline module imports cannot yet be bundled. Move the module into a selected .js or .mjs file and reference it with a script src.');
 }
 const plan=planAssets(source,files);
 if(plan.bytes>MAX_BUNDLE_BYTES)throw Error('Selected assets exceed the 30 MB bundle limit.');
 const replacements=new Map(),encodedFiles=new Map(),pendingCss=new Set(),pendingJs=new Set(),usedFiles=new Set();
 const available=new Map();for(const file of files){const p=safePath(file.webkitRelativePath||file.name);if(p){const group=available.get(p)||[];group.push(file);available.set(p,[...new Set(group)])}}
 const resolveFile=(path,kind='nested')=>{const exact=available.get(path)||[];const suffix=[...available.keys()].filter(k=>k.endsWith('/'+path)).flatMap(k=>available.get(k));const found=[...new Set(exact.length?exact:suffix)];if(found.length!==1)throw Error(found.length?'Ambiguous '+kind+' asset: '+path:'Missing '+kind+' asset: '+path);return found[0]};
 const readFile=async file=>{if(encodedFiles.has(file))return encodedFiles.get(file);const buffer=await file.arrayBuffer();const arr=new Uint8Array(buffer);if(arr.byteLength>MAX_BUNDLE_BYTES)throw Error('Asset exceeds the 30 MB bundle limit.');let raw='';for(let i=0;i<arr.length;i+=8192)raw+=String.fromCharCode(...arr.subarray(i,i+8192));const encoded=btoa(raw);encodedFiles.set(file,encoded);return encoded};
 const textOf=async file=>typeof file.text==='function'?await file.text():new TextDecoder().decode(await file.arrayBuffer());
 const toBase64=text=>btoa(unescape(encodeURIComponent(text)));
 const makeData=async(path,file)=>{
  usedFiles.add(file);
  if(/\.css$/i.test(path)){
   if(pendingCss.has(path))throw Error('Circular stylesheet import: '+path);
   pendingCss.add(path);
   try{
    let css=await textOf(file);
    for(const ref of cssRefs(css).filter(cssLocal)){
     const dep=cssResolve(path,ref),depFile=resolveFile(dep,'CSS');
     const data=await makeData(dep,depFile);
     css=css.split(ref).join(data);
    }
    return 'data:text/css;base64,'+toBase64(css);
   }finally{pendingCss.delete(path)}
  }
  if(/\.(?:m?js)$/i.test(path)){
   if(pendingJs.has(path))throw Error('Circular JavaScript module graph is not yet supported: '+path);
   pendingJs.add(path);
   try{
    let js=await textOf(file);
    if(/\bimport\s*\(\s*(?!['"])/.test(js))throw Error('Non-literal dynamic import in '+path+' cannot be bundled safely. Use a static or string-literal import.');
    const refs=jsModuleRefs(js);
    for(const match of [...refs].reverse()){
     const ref=match.ref;
     validateModuleRef(ref,path);
     if(!jsLocal(ref))continue;
     const dep=jsResolve(path,ref),depFile=resolveFile(dep,'JavaScript');
     if(!/\.(?:m?js)$/i.test(dep))throw Error('JavaScript module import must resolve to a .js or .mjs file: '+dep);
     const data=await makeData(dep,depFile);
     const offset=match.start;
     js=js.slice(0,offset)+data+js.slice(offset+ref.length);
    }
    return 'data:text/javascript;base64,'+toBase64(js);
   }finally{pendingJs.delete(path)}
  }
  return 'data:'+assetMimeType(file,path)+';base64,'+await readFile(file);
 };
 for(const [path,file] of plan.matches)replacements.set(path,await makeData(path,file));
 const totalBytes=[...usedFiles].reduce((sum,file)=>sum+file.size,0);
 if(totalBytes>MAX_BUNDLE_BYTES)throw Error('Selected assets exceed the 30 MB bundle limit.');
 let html=source;
 for(const [path,data] of replacements){
  for(const prefix of ['', './']){
   for(const encodedPath of new Set([path,encodeURI(path),encodeURIComponent(path).replace(/%2F/gi,'/')])){
   const target=prefix+encodedPath;
   const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   const escaped=escapeRegExp(target);
   const quoted=new RegExp('(["\\x27])'+escaped+'([?#][^"\\x27\\s]*)?\\1','g');
   html=html.replace(quoted,(_all,quote,suffix='')=>quote+data+quote);
   const srcset=new RegExp('(["\\x27,]\\s*)'+escaped+'([?#][^\\s,"\\x27]*)?(\\s+\\d+(?:\\.\\d+)?[wx])','g');
   html=html.replace(srcset,(_all,lead,suffix='',descriptor)=>lead+data+descriptor);
   // Unquoted HTML references were detected by import-check but previously left unchanged.
   // Restrict replacements to asset-bearing attributes rather than arbitrary text.
   const unquoted=new RegExp('(\\b(?:src|href|poster|data)\\s*=\\s*)'+escaped+'([?#][^\\s>"\\x27]*)?(?=[\\s>])','gi');
   html=html.replace(unquoted,(_all,lead)=>lead+data);
   const css=new RegExp('(url\\(\\s*)'+escaped+'([?#][^\\s)]*)?(\\s*\\))','gi');
   html=html.replace(css,(_all,lead,suffix='',end)=>lead+data+end);
   }
  }
 }
 return {html,matched:replacements.size,bundledFiles:usedFiles.size,missing:[...plan.missing,...plan.ambiguous.map(x=>x+' (ambiguous)')],bytes:totalBytes};
}
