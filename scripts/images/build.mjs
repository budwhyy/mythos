// Turns reviewed picks into bundled images and writes the `image` field into data/entities.json.
//   node scripts/images/build.mjs
// Reads data/images/picks.json: { [entityId]: { source, id, alt?, focus? } }, resolves each against
// $TEMP/img/candidates.json (from probe.mjs), downloads the full-size file, writes
//   public/img/figures/<id>.jpg (max 1000px, q80) and <id>-thumb.jpg (320px square, cover crop at focus).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import sharp from 'sharp';

const picks = JSON.parse(readFileSync('data/images/picks.json', 'utf8'));
delete picks._comment;
const cands = JSON.parse(readFileSync(process.env.TEMP + '/img/candidates.json', 'utf8'));
const entities = JSON.parse(readFileSync('data/entities.json', 'utf8'));
const UA = { 'User-Agent': 'MYTHOS-atlas/0.1 (https://github.com/budwhyy/mythos)' };
mkdirSync('public/img/figures', { recursive: true });

const strip = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
let done = 0;
for (const e of entities) {
  const pick = picks[e.id];
  if (!pick || e.id.startsWith('_')) {
    delete e.image;
    continue;
  }
  // "M3" / "C7" are sheet tokens: an index into the combined [met..., commons...] list the sheets were rendered from.
  const combined = [...(cands[e.id]?.met ?? []), ...(cands[e.id]?.commons ?? [])].slice(0, 10);
  const c = typeof pick.pick === 'string' ? combined[Number(pick.pick.slice(1))] : (cands[e.id]?.[pick.source] ?? []).find((x) => x.id === pick.id);
  if (!c) throw new Error(`${e.id}: pick ${JSON.stringify(pick)} not among candidates`);
  const out = `public/img/figures/${e.id}.jpg`;
  const thumb = `public/img/figures/${e.id}-thumb.jpg`;
  if (!existsSync(out) || process.env.FORCE) {
    // 800px Commons rendition / Met web-large: enough for a 1000px hero and far smaller than the originals.
    const res = await fetch(c.thumb, { headers: UA });
    if (!res.ok) throw new Error(`${e.id}: ${res.status} ${c.thumb}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).rotate().resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
    const fx = (pick.focus?.x ?? 50) / 100;
    const fy = (pick.focus?.y ?? 50) / 100;
    const meta = await sharp(buf).rotate().metadata();
    const side = Math.min(meta.width, meta.height) * (pick.zoom ?? 1);
    const left = Math.round(Math.min(Math.max(meta.width * fx - side / 2, 0), meta.width - side));
    const top = Math.round(Math.min(Math.max(meta.height * fy - side / 2, 0), meta.height - side));
    await sharp(buf).rotate().extract({ left, top, width: Math.round(side), height: Math.round(side) }).resize(320, 320).jpeg({ quality: 78, mozjpeg: true }).toFile(thumb);
  }
  e.image = {
    src: `/img/figures/${e.id}.jpg`,
    thumb: `/img/figures/${e.id}-thumb.jpg`,
    alt: pick.alt ?? `${e.name}: ${strip(c.title)}`,
    title: strip(c.title),
    ...(c.date ? { objectDate: strip(c.date) } : {}),
    credit: strip(c.credit) || (c.source === 'commons' ? 'Wikimedia Commons' : 'The Metropolitan Museum of Art'),
    ...(c.artist ? { artist: strip(c.artist) } : {}),
    licence: c.licence,
    ...(c.licenceUrl ? { licenceUrl: c.licenceUrl } : {}),
    url: c.url,
    source: c.source,
    ...(pick.focus ? { focus: pick.focus } : {}),
  };
  done++;
  console.log('✓', e.id, c.source, strip(c.title).slice(0, 60));
}
writeFileSync('data/entities.json', JSON.stringify(entities, null, 2) + '\n');
console.log(`${done} figures with images`);
