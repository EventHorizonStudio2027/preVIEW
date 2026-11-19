/** Pure, side-effect-free workspace helpers. */
export function safeExportName(name,kind='backup'){
 const clean=String(name||'untitled').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55)||'untitled';
 if(!['backup','manifest'].includes(kind))throw Error('Invalid export type');
 return `preview-${clean}-${kind}.json`;
}
export function canMarkMoment(start){return typeof start==='number'&&Number.isFinite(start)&&start>=0}
export function projectHealth(project){
 if(!project?.fileName)return {level:'attention',label:'Import a game or try the demo'};
 if(!Array.isArray(project.moments)||project.moments.length===0)return {level:'attention',label:'Game loaded · Mark your first moment'};
 const missing=project.moments.filter(m=>m.checkpoint==null).length;
 if(missing)return {level:'attention',label:`${missing} checkpoint${missing===1?'':'s'} still needed`};
 return {level:'ready',label:'All moments have checkpoints'};
}
