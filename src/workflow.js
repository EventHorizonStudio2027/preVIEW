import {validateDestination} from './model.js';
/** Pure progress model; steps indicate configured inputs, not publication. */
export function creatorProgress(project, sourceLoaded = true) {
  const named = Boolean(typeof project?.fileName === 'string' && project.fileName.trim());
  const imported = named && sourceLoaded;
  const moments = Array.isArray(project?.moments) ? project.moments.length : 0;
  const url = typeof project?.ctaUrl === 'string' ? validateDestination(project.ctaUrl) : null;
  const destination = Boolean(url);
  return [
    {id:'import', label:'Import a game', done:imported, detail:imported ? project.fileName : named ? 'Reimport the game to play it' : 'Choose HTML or try the demo'},
    {id:'moments', label:'Choose moments', done:imported && moments>0, detail:moments ? `${moments} moment${moments===1?'':'s'} selected` : 'Capture the highlights'},
    {id:'review', label:'Review & export', done:imported && moments>0 && destination, detail:destination ? 'Destination configured; not published' : 'Add a valid destination URL'}
  ];
}
