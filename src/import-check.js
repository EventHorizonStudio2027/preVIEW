/** Static import diagnostics; never executes uploaded HTML. */
export function inspectHtml(source, filename='game.html') {
  if (typeof source !== 'string' || source.length > 20*1024*1024) throw Error('HTML source exceeds 20 MB.');
  if (!/\.html?$/i.test(filename)) throw Error('Expected an HTML file.');
  const external = [];
  const refs = /<(?:script|img|audio|video|source|link)\b[^>]*?\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi;
  for (const m of source.matchAll(refs)) {
    const value=m[2].trim();
    if (!value || value.startsWith('#') || /^(?:data:|blob:)/i.test(value)) continue;
    if (/^(?:https?:)?\/\//i.test(value)) external.push({kind:'remote',path:value});
    else if (/^(?:javascript:|file:)/i.test(value)) external.push({kind:'unsafe',path:value});
    else external.push({kind:'local',path:value});
  }
  const hasSdk = /\bpreVIEW\s*\.\s*register\s*\(/.test(source);
  const local=external.filter(x=>x.kind==='local');
  const unsafe=external.filter(x=>x.kind==='unsafe');
  return {
    compatible:unsafe.length===0 && local.length===0,
    sdkDetected:hasSdk,
    references:external.slice(0,100),
    totalReferences:external.length,
    warnings:[...(local.length?[`${local.length} local asset reference(s) may fail when importing one HTML file.`]:[]),...(unsafe.length?[`${unsafe.length} unsafe asset reference(s) detected.`]:[]),...(external.some(x=>x.kind==='remote')?['Remote assets depend on network access and third-party availability.']:[]),...(!hasSdk?['No preVIEW checkpoint SDK registration detected; checkpoint playback may be unavailable.']:[])]
  };
}
