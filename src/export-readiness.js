/** Pure, advisory checks for a planning manifest; no hosted build implied. */
import {validateDestination} from './model.js';
export function exportReadiness(project) {
  const issues=[];
  if (!project || !Array.isArray(project.moments)) return {ready:false,issues:['Project data is invalid.']};
  if (!project.fileName) issues.push('Import a game before exporting.');
  if (project.moments.length===0) issues.push('Add at least one moment.');
  const total=project.moments.reduce((sum,m)=>sum+(Number.isFinite(m.durationSeconds)?m.durationSeconds:8),0);
  if (Number.isFinite(project.duration) && total>project.duration) issues.push('Timeline exceeds target by '+(total-project.duration)+' seconds.');
  if (!project.ctaUrl || validateDestination(project.ctaUrl)===null || validateDestination(project.ctaUrl)==='') issues.push('Set a valid HTTP or HTTPS call-to-action URL.');
  const missing=project.moments.filter(m=>m.checkpoint==null).length;
  if (missing) issues.push(missing+' moment'+(missing===1?'':'s')+' lack checkpoints for guided playback.');
  return {ready:issues.length===0,issues,totalSeconds:total};
}