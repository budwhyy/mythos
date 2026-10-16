import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
const dir = process.env.TEMP + '/img';
const cands = JSON.parse(readFileSync(dir + '/candidates.json', 'utf8'));
const ids = Object.keys(cands);
const PER = 6;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
for (let i = 0; i < ids.length; i += PER) {
  const batch = ids.slice(i, i + PER);
  const rows = batch.map((id) => {
    const all = [...cands[id].met.map((c) => ({ ...c, tag: 'M' })), ...cands[id].commons.map((c) => ({ ...c, tag: 'C' }))].slice(0, 10);
    const cells = all.map((c, k) => `<figure><img src="${c.thumb}" loading="eager"><figcaption><b>${c.tag}${k}</b> ${(c.title || '').slice(0, 42)}<br><i>${(c.date || '').slice(0, 24)}</i> ${c.licence}</figcaption></figure>`).join('');
    return `<section><h2>${id} <small>(${cands[id].name})</small></h2><div class="row">${cells || '<p>— no candidates —</p>'}</div></section>`;
  });
  const html = `<html><head><style>body{background:#111;color:#eee;font:11px sans-serif;margin:8px}h2{margin:6px 0 2px;font-size:14px;color:#C9A227}.row{display:flex;gap:4px;flex-wrap:nowrap}figure{margin:0;width:132px}img{width:132px;height:110px;object-fit:cover;background:#222;display:block}figcaption{line-height:1.15;height:40px;overflow:hidden}</style></head><body>${rows.join('')}</body></html>`;
  const f = `${dir}/sheet-${String(i / PER).padStart(2, '0')}.html`;
  writeFileSync(f, html);
  await page.goto('file:///' + f.split('\\').join('/'));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: f.replace('.html', '.png'), fullPage: true });
  console.log('sheet', i / PER, batch.join(','));
}
await browser.close();
