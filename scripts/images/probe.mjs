// Collect candidate images for every figure: Met Open Access (CC0) first, then Wikimedia Commons categories.
// Output: $TEMP/img/candidates.json  — reviewed by hand before anything is bundled.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const entities = JSON.parse(readFileSync('data/entities.json', 'utf8'));
const MET = 'https://collectionapi.metmuseum.org/public/collection/v1.1'; // search is v1.1 (paginated)
const MET_OBJ = 'https://collectionapi.metmuseum.org/public/collection/v1'; // objects stayed on v1
const UA = { 'User-Agent': 'MYTHOS-atlas/0.1 (https://github.com/budwhyy/mythos)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OK_LICENCES = /^(Public domain|CC0|CC BY( |-SA )?[0-9.]+)/i;

/** GET JSON with 429/5xx back-off; the Met rate-limits bursts. */
async function getJSON(url, headers = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(url, { headers });
    if (r.status === 429 || r.status >= 500) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  }
  throw new Error('gave up ' + url);
}

async function met(name) {
  const cands = [];
  const s = await getJSON(`${MET}/search?q=${encodeURIComponent(name)}&hasImages=true&isPublicDomain=true&departmentId=13&limit=25&offset=0`);
  for (const id of s.objectIDs ?? []) {
    try {
      const o = await getJSON(`${MET_OBJ}/objects/${id}`);
      const hay = `${o.title} ${(o.tags ?? []).map((t) => t.term).join(' ')}`.toLowerCase();
      if (!hay.includes(name.toLowerCase()) || !o.primaryImageSmall) continue;
      cands.push({ source: 'met', id: String(id), title: o.title, date: o.objectDate, medium: o.medium, culture: o.culture, credit: `The Metropolitan Museum of Art, ${o.creditLine}`, licence: 'CC0', thumb: o.primaryImageSmall, full: o.primaryImage, url: o.objectURL, artist: '' });
      if (cands.length >= 10) break;
    } catch (err) {
      console.log('  skip', id, String(err).slice(0, 60));
    }
    await sleep(250);
  }
  return cands;
}

async function commonsCategory(cat, limit = 12) {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=${encodeURIComponent(cat)}&gcmtype=file&gcmlimit=${limit}&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=800&format=json`;
  try {
    const d = await (await fetch(u, { headers: UA })).json();
    return Object.values(d.query?.pages ?? {})
      .map((p) => {
        const ii = p.imageinfo?.[0];
        const m = ii?.extmetadata ?? {};
        const lic = m.LicenseShortName?.value ?? '';
        if (!ii || !/^image\/(jpeg|png)/.test(ii.mime) || !OK_LICENCES.test(lic)) return null;
        const strip = (s) => (s ?? '').replace(/<[^>]+>/g, '').trim();
        return { source: 'commons', id: p.title, title: strip(m.ObjectName?.value) || p.title.replace(/^File:/, ''), date: strip(m.DateTimeOriginal?.value), medium: '', credit: strip(m.Credit?.value), artist: strip(m.Artist?.value), licence: lic, licenceUrl: m.LicenseUrl?.value ?? '', thumb: ii.thumburl, full: ii.url, url: ii.descriptionurl };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Commons category names vary between Latin and Greek spellings; bare "Category:<Name>" is NOT used (it is full of moons, butterflies and excavators).
const ALIASES = {
  dionysus: ['Dionysos', 'Dionysus'], cronus: ['Kronos', 'Cronus', 'Saturn (mythology)'], heracles: ['Herakles', 'Heracles'], hephaestus: ['Hephaistos', 'Hephaestus'],
  oceanus: ['Okeanos', 'Oceanus'], calypso: ['Kalypso', 'Calypso (mythology)'], circe: ['Kirke', 'Circe'], hekatoncheires: ['Hekatoncheires', 'Hecatoncheires'],
  cyclopes: ['Cyclopes', 'Kyklopes', 'Polyphemus'], uranus: ['Ouranos', 'Uranus (mythology)', 'Caelus'], tartarus: ['Tartaros', 'Tartarus (mythology)'],
  rhea: ['Rhea (mythology)'], tethys: ['Tethys (mythology)'], metis: ['Metis (mythology)'], dione: ['Dione (mythology)'], maia: ['Maia (mythology)'],
  coeus: ['Koios', 'Coeus'], crius: ['Krios', 'Crius'], hyperion: ['Hyperion (mythology)'], iapetus: ['Iapetos', 'Iapetus (mythology)'], theia: ['Theia (mythology)'],
  phoebe: ['Phoebe (mythology)'], aether: ['Aether (mythology)'], hemera: ['Hemera'], pontus: ['Pontos (mythology)', 'Pontus (mythology)'], chaos: ['Chaos (cosmogony)'],
  penelope: ['Penelope'], semele: ['Semele'], alcmene: ['Alcmene', 'Alkmene'], mnemosyne: ['Mnemosyne'], themis: ['Themis (mythology)'],
};
const CAT_PATTERNS = (id, n) =>
  (ALIASES[id] ?? [n]).flatMap((a) => [
    `Category:${a} in ancient Greek pottery`, `Category:${a} in ancient Greek sculpture`, `Category:${a} in ancient Greek art`, `Category:${a} in ancient Roman art`,
    `Category:${a} in ancient Roman sculpture`, `Category:${a} in ancient Roman mosaics`, `Category:${a} in art`, `Category:${a} in paintings`, `Category:${a} in sculptures`,
    `Category:${a}`, // last resort: mixed quality, used only through manual review
  ]);

// ONLY=met reuses the existing Commons candidates and refreshes only the Met side.
const file = process.env.TEMP + '/img/candidates.json';
const only = process.env.ONLY;
const out = only && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
for (const e of entities) {
  if (only === 'met' && out[e.id]?.metDone) continue; // resumable
  const name = e.name === 'Hundred-Handers' ? 'Hecatoncheires' : e.name;
  let m = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      m = only === 'commons' ? out[e.id]?.met ?? [] : await met(name);
      break;
    } catch (err) {
      console.log('retry', e.id, String(err).slice(0, 80));
      await sleep(2000);
    }
  }
  let c = only === 'met' ? out[e.id]?.commons ?? [] : [];
  if (only !== 'met')
    for (const cat of CAT_PATTERNS(e.id, name)) {
      if (c.length >= 12) break;
      c = c.concat(await commonsCategory(cat));
      await sleep(80);
    }
  out[e.id] = { name: e.name, met: m, commons: c.slice(0, 12), metDone: only !== 'commons' };
  console.log(e.id.padEnd(16), 'met', m.length, 'commons', c.length);
  writeFileSync(file, JSON.stringify(out, null, 1)); // incremental, so a crash loses nothing
}
writeFileSync(file, JSON.stringify(out, null, 1));
console.log('DONE');
