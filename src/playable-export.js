/** Build a portable, single-file playable preview. No hosting is implied. */
import {validateDestination} from './model.js';
import {inspectHtml} from './import-check.js';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function base64(text){const bytes=new TextEncoder().encode(text);let result='';for(let i=0;i<bytes.length;i+=8192)result+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(result)}
export function playableDiagnostics(sourceHtml){
 if(!sourceHtml)return {available:false,local:0,remote:0,unsafe:0,bytes:0,portable:false};
 const inspection=inspectHtml(sourceHtml,'game.html');
 const bytes=new TextEncoder().encode(sourceHtml).length;
 return {available:true,...inspection.counts,bytes,runtimeDependencies:inspection.runtimeDependencies,portable:inspection.counts.local===0&&inspection.counts.unsafe===0};
}
export function buildPlayableHtml(project,sourceHtml){
 if(typeof sourceHtml!=='string'||!sourceHtml.trim())throw Error('Import a game HTML file before exporting a playable preview.');
 const inspection=inspectHtml(sourceHtml,'game.html');
 if(inspection.counts.unsafe)throw Error('Cannot export a game with unsafe asset references.');
 const destination=validateDestination(project?.ctaUrl||'');if(!destination)throw Error('Enter a valid HTTP or HTTPS destination.');
 const name=escapeHtml((project?.name||'Untitled preview').slice(0,80));
 const label=escapeHtml((project?.ctaText||'Play the full game').slice(0,70));
 const encoded=base64(sourceHtml);
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${name} — preVIEW</title><style>*{box-sizing:border-box}body{margin:0;background:#f7f5ff;color:#2b2e3a;font:15px system-ui,-apple-system,sans-serif}.shell{max-width:1180px;margin:auto;padding:16px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:12px}.brand{font-weight:850;color:#7958e8;letter-spacing:-.04em}.brand span{color:#2b2e3a}.title{font-weight:650}a.cta{background:#7958e8;color:white;padding:11px 18px;border-radius:12px;text-decoration:none;font-weight:700}a.cta:focus-visible{outline:3px solid #2b2e3a;outline-offset:3px}.frame{border:1px solid #e9e1ff;border-radius:18px;overflow:hidden;background:white;box-shadow:0 12px 40px #35256812}iframe{display:block;width:100%;height:min(78vh,760px);border:0}footer{padding:12px 2px;color:#6b647c;font-size:12px}@media(max-width:600px){.shell{padding:10px}iframe{height:75vh}.top{align-items:flex-start}}</style></head><body><main class="shell"><header class="top"><div><div class="brand">pre<span>VIEW</span></div><div class="title">${name}</div></div><a class="cta" href="${escapeHtml(destination)}" target="_blank" rel="noopener noreferrer">${label}</a></header><div class="frame"><iframe id="game" title="Playable game" sandbox="allow-scripts allow-pointer-lock" allow="fullscreen" referrerpolicy="no-referrer"></iframe></div><footer>Playable HTML preview · Exported with preVIEW · External assets may require internet access.</footer></main><script>const encoded='${encoded}';const raw=atob(encoded);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));document.getElementById('game').srcdoc=new TextDecoder().decode(bytes);<\/script></body></html>`;
}
