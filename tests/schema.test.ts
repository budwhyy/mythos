import { describe, expect, it } from 'vitest';
import { raw } from '@/lib/raw';
import { validateDataset, type RawDataset } from '@/lib/schema';

const clone = (): RawDataset => JSON.parse(JSON.stringify(raw));

const minimal = (): RawDataset => ({
  sources: [{ id: 'hes', author: 'Hesiod', work: 'Theogony' }],
  stages: [{ id: 'origins', name: 'Origins', order: 0, tagline: 't', description: 'd', sources: ['hes'] }],
  entities: [
    { id: 'chaos', name: 'Chaos', type: 'primordial', summary: { beginner: 'b', intermediate: 'i', scholarly: 's' }, mythicStage: 'origins', sources: ['hes'] },
    { id: 'gaia', name: 'Gaia', type: 'primordial', summary: { beginner: 'b', intermediate: 'i', scholarly: 's' }, mythicStage: 'origins', sources: ['hes'] },
  ],
  relationships: [{ id: 'r1', from: 'chaos', to: 'gaia', kind: 'sibling', source: 'hes' }],
  mythicEvents: [{ id: 'e1', frame: 'mythic', name: 'E', stage: 'origins', participants: ['chaos'], summary: 's', sources: ['hes'] }],
  historicalEvents: [
    { id: 'h1', frame: 'historical', name: 'H', period: 'archaic', dateRange: { start: 730, end: 680, era: 'BCE' }, confidence: 'medium', evidenceType: 'literary', summary: 's', sources: ['hes'] },
  ],
  periods: [{ id: 'archaic', name: 'Archaic', startYear: -750, endYear: -480, description: 'd' }],
  attestations: [{ id: 'a1', frame: 'attestation', kind: 'first_attestation', mythicRef: 'e1', historicalRef: 'h1', label: 'l', note: 'n', sources: ['hes'] }],
  locations: [
    { id: 'delphi', ancientName: 'Delphi', modernName: 'Delfoi', classification: 'verified', coords: { lat: 38.48, lng: 22.5 }, ancientNote: 'a', modernNote: 'm', linkedEntities: [], linkedEvents: [], sources: ['hes'] },
  ],
  journeys: [],
  learning: [],
});

describe('schema on empty data', () => {
  it('accepts an empty dataset', () => {
    const empty = Object.fromEntries(Object.keys(raw).map((k) => [k, []])) as unknown as RawDataset;
    expect(validateDataset(empty)).toEqual(expect.objectContaining({ ok: true }));
  });
  it('accepts a minimal valid dataset', () => {
    const r = validateDataset(minimal());
    expect(r.ok ? [] : r.errors).toEqual([]);
  });
});

describe('two-clock rules', () => {
  const errorsOf = (d: RawDataset) => {
    const r = validateDataset(d);
    return r.ok ? [] : r.errors;
  };

  it('fails when a mythic event has a date field', () => {
    const d = minimal();
    (d.mythicEvents as any[])[0].date = '1250 BCE';
    expect(errorsOf(d).some((e) => /date/i.test(e))).toBe(true);
  });
  it('fails when a mythic event has a dateRange', () => {
    const d = minimal();
    (d.mythicEvents as any[])[0].dateRange = { start: 1250, end: 1180, era: 'BCE' };
    expect(errorsOf(d).length).toBeGreaterThan(0);
  });
  it('fails when a mythic entity mentions an absolute date in its text', () => {
    const d = minimal();
    (d.entities as any[])[0].summary.scholarly = 'Recorded c. 700 BCE.';
    expect(errorsOf(d).some((e) => /absolute date/.test(e))).toBe(true);
  });
  it('fails when a mythic stage carries a year', () => {
    const d = minimal();
    (d.stages as any[])[0].year = -3000;
    expect(errorsOf(d).length).toBeGreaterThan(0);
  });
  it('fails when a mythical location has coords', () => {
    const d = minimal();
    (d.locations as any[]).push({
      id: 'ogygia', ancientName: 'Ogygia', modernName: '—', classification: 'mythical', coords: { lat: 36, lng: 14 }, symbolic: { x: 1, y: 1 },
      ancientNote: 'a', modernNote: 'm', linkedEntities: [], linkedEvents: [], sources: ['hes'],
    });
    expect(errorsOf(d).some((e) => /mythical locations may not have coords/.test(e))).toBe(true);
  });
  it('fails when an entity has zero sources', () => {
    const d = minimal();
    (d.entities as any[])[0].sources = [];
    expect(errorsOf(d).length).toBeGreaterThan(0);
  });
  it('fails when a relationship references an unknown entity', () => {
    const d = minimal();
    (d.relationships as any[])[0].to = 'nobody';
    expect(errorsOf(d).some((e) => /unknown entity "nobody"/.test(e))).toBe(true);
  });
  it('fails when an attestation points its historical side at a mythic event', () => {
    const d = minimal();
    (d.attestations as any[])[0].historicalRef = 'e1';
    expect(errorsOf(d).length).toBeGreaterThan(0);
  });
  it('fails when a historical event lacks a date range', () => {
    const d = minimal();
    delete (d.historicalEvents as any[])[0].dateRange;
    expect(errorsOf(d).length).toBeGreaterThan(0);
  });
});

describe('shipped data', () => {
  it('passes validation', () => {
    const r = validateDataset(clone());
    expect(r.ok ? [] : r.errors).toEqual([]);
  });
});
