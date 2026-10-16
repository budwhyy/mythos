// Probe the Met Open Access API (CC0) for objects depicting each MYTHOS figure.
// Writes candidates to $TEMP/img/met-candidates.json for review.
import { readFileSync, writeFileSync } from 'node:fs';
const entities = JSON.parse(readFileSync('data/entities.json', 'utf8'));
const API = 'https://collectionapi.metmuseum.org/public/collection/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
for (const e of entities) {
  const q = encodeURIComponent(e.name);
  let ids = [];
  try {
    const r = await fetch(`${API}/search?q=${q}&hasImages=true&isPublicDomain=true&departmentId=13`);
    ids = (await r.json()).objectIDs ?? [];
  } catch {}
  const cands = [];
  for (const id of ids.slice(0, 40)) {
    try {
      const o = await (await fetch(`${API}/objects/${id}`)).json();
      const hay = `${o.title} ${(o.tags ?? []).map((t) => t.term).join(' ')}`.toLowerCase();
      if (!hay.includes(e.name.toLowerCase())) continue;
      if (!o.primaryImageSmall) continue;
      cands.push({ id, title: o.title, date: o.objectDate, medium: o.medium, culture: o.culture, credit: o.creditLine, img: o.primaryImageSmall, url: o.objectURL });
      if (cands.length >= 8) break;
    } catch {}
    await sleep(60);
  }
  out[e.id] = cands;
  console.log(e.id.padEnd(16), ids.length, '→', cands.length);
}
writeFileSync(process.env.TEMP + '/img/met-candidates.json', JSON.stringify(out, null, 1));
