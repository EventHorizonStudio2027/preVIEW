/** Static import diagnostics. No uploaded code is executed here. */
const MAX_HTML_BYTES = 20 * 1024 * 1024;
const MAX_REPORT = 100;
function classify(raw) {
  const path = raw.trim();
  let decoded;
  try { decoded = decodeURIComponent(path); } catch { return {kind:'unsafe',path}; }
  if (/[\\\x00-\x1f]/.test(decoded) || /^(?:javascript:|file:|vbscript:|about:)/i.test(decoded)) return {kind:'unsafe',path};
  if (decoded.split(/[?#]/)[0].split('/').some(segment=>segment==='..')) return {kind:'unsafe',path};
  if (!path || path.startsWith('#') || /^(?:data:|blob:)/i.test(path)) return null;
  if (/^(?:javascript:|file:|vbscript:|about:)/i.test(path)) return {kind:'unsafe',path};
  if (/^(?:https?:)?\/\//i.test(path)) return {kind:'remote',path};
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return {kind:'unsafe',path};
  if (path.startsWith('/') || path.startsWith('\\') || path.split(/[?#]/)[0].split('/').some(segment=>segment==='..')) return {kind:'unsafe',path};
  return {kind:'local',path};
}
function collect(source) {
  const values=[];
  // Supports quoted and unquoted HTML attribute values.
  const tag=/<(?:script|img|audio|video|source|link|iframe|track|embed|object)\b[^>]*>/gi;
  const attr=/\b(?:src|href|poster|data|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  for (const match of source.matchAll(tag)) {
    for (const a of match[0].matchAll(attr)) {
      const value=a[1]??a[2]??a[3]??'';
      if (/^srcset\\s*=/i.test(a[0])) {
        for (const part of value.split(',')) {
          const candidate=part.trim().split(/\\s+/)[0];
          if(candidate)values.push(candidate);
        }
      } else values.push(value);
    }
  }
  // CSS imports and url() references can also break single-file previews.
  const css=/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)|@import\s+(?:"([^"]+)"|'([^']+)')/gi;
  for (const m of source.matchAll(css)) values.push(m[1]??m[2]??m[3]??m[4]??m[5]);
  return values.map(classify).filter(Boolean);
}
export function inspectHtml(source, filename='game.html') {
  if (typeof source !== 'string' || new TextEncoder().encode(source).length > MAX_HTML_BYTES) throw Error('HTML source exceeds 20 MB.');
  if (!/\.html?$/i.test(filename)) throw Error('Expected an HTML file.');
  const references=collect(source);
  const counts={local:0,remote:0,unsafe:0};
  for (const ref of references) counts[ref.kind]++;
  const sdkDetected=/\bpreVIEW\s*\.\s*register\s*\(/.test(source);
  return {
    compatible:counts.unsafe===0 && counts.local===0,
    canImport:counts.unsafe===0,
    sdkDetected,
    references:references.slice(0,MAX_REPORT),
    totalReferences:references.length,
    counts,
    warnings:[
      ...(counts.local?[`${counts.local} local asset reference(s) may fail when importing one HTML file.`]:[]),
      ...(counts.unsafe?[`${counts.unsafe} unsafe asset reference(s) detected.`]:[]),
      ...(counts.remote?['Remote assets depend on network access and third-party availability.']:[]),
      ...(!sdkDetected?['No preVIEW checkpoint SDK registration detected; checkpoint playback may be unavailable.']:[])
    ]
  };
}
