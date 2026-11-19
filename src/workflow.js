/** Pure progress model for the three-step creator workflow. */
export function creatorProgress(project) {
  const imported = Boolean(project?.fileName);
  const moments = Array.isArray(project?.moments) ? project.moments.length : 0;
  const destination = typeof project?.ctaUrl === 'string' && /^https?:\/\/[^\s/]+/i.test(project.ctaUrl.trim());
  return [
    {id:'import', label:'Import a game', done:imported, detail:imported ? project.fileName : 'Choose HTML or try the demo'},
    {id:'moments', label:'Choose moments', done:moments>0, detail:moments ? `${moments} moment${moments===1?'':'s'} selected` : 'Capture the highlights'},
    {id:'review', label:'Review & export', done:imported && moments>0 && destination, detail:destination ? 'Destination configured' : 'Add a destination URL'}
  ];
}
