import { describe, expect, it } from 'vitest';
import { data, stagesOrdered } from '@/lib/data';

const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id));

describe('content minimums from the brief', () => {
  it('has the eight mythic stages in order', () => {
    expect(stagesOrdered.map((s) => s.name)).toEqual([
      'Primordial Origins', 'Primordial Generations', 'Age of Titans', 'Titanomachy',
      'Olympian Age', 'Age of Heroes', 'Trojan War', 'Heroic Aftermath',
    ]);
  });

  it('has at least 40 family-tree nodes including every required figure', () => {
    expect(data.entities.length).toBeGreaterThanOrEqual(40);
    const required = [
      'chaos', 'gaia', 'tartarus', 'eros', 'nyx', 'erebus', 'uranus', 'pontus',
      'oceanus', 'coeus', 'crius', 'hyperion', 'iapetus', 'theia', 'rhea', 'themis', 'mnemosyne', 'phoebe', 'tethys', 'cronus',
      'hestia', 'demeter', 'hera', 'hades', 'poseidon', 'zeus',
      'athena', 'apollo', 'artemis', 'ares', 'hephaestus', 'aphrodite', 'hermes', 'dionysus', 'persephone',
    ];
    const have = ids(data.entities);
    expect(required.filter((r) => !have.has(r))).toEqual([]);
    expect(data.entities.filter((e) => e.type === 'titan' && ['oceanus','coeus','crius','hyperion','iapetus','theia','rhea','themis','mnemosyne','phoebe','tethys','cronus'].includes(e.id))).toHaveLength(12);
  });

  it('uses all five relationship kinds', () => {
    expect(new Set(data.relationships.map((r) => r.kind))).toEqual(new Set(['parent', 'partner', 'sibling', 'conflict', 'alliance']));
  });

  it('records Aphrodite\'s conflicting genealogies as separate source-tagged edges', () => {
    const parents = data.relationships.filter((r) => r.kind === 'parent' && r.to === 'aphrodite');
    expect(new Set(parents.map((p) => p.source))).toEqual(new Set(['hesiod-theogony', 'homer-iliad']));
  });

  it('has at least 15 historical events covering the required topics', () => {
    expect(data.historicalEvents.length).toBeGreaterThanOrEqual(15);
    const have = ids(data.historicalEvents);
    for (const id of ['linear-b-pylos', 'homeric-epics', 'hesiod-theogony-composed', 'olympia-early-cult', 'delphi-sanctuary', 'alexander-siwa', 'serapis-cult', 'capitoline-temple', 'theodosian-edicts'])
      expect(have.has(id), id).toBe(true);
    const periods = new Set(data.historicalEvents.map((h) => h.period));
    for (const p of data.periods) expect(periods.has(p.id), `period ${p.id} has events`).toBe(true);
  });

  it('has at least 12 attestation bridges', () => {
    expect(data.attestations.length).toBeGreaterThanOrEqual(12);
  });

  it('puts the Trojan War in both frames', () => {
    expect(data.mythicEvents.some((m) => m.id === 'trojan-war-myth')).toBe(true);
    expect(data.attestations.some((a) => a.mythicRef === 'trojan-war-myth' && a.historicalRef === 'troy-destruction-layers')).toBe(true);
  });

  it('has at least 20 classified locations including the required ones', () => {
    expect(data.locations.length).toBeGreaterThanOrEqual(20);
    const have = ids(data.locations);
    for (const id of ['olympus', 'othrys', 'delphi', 'knossos', 'mycenae', 'troy', 'athens', 'sparta', 'thebes', 'argos', 'corinth', 'olympia', 'dodona', 'eleusis', 'pylos', 'ithaca', 'colchis', 'avernus', 'underworld', 'hesperides', 'ogygia', 'aeaea'])
      expect(have.has(id), id).toBe(true);
    expect(data.locations.find((l) => l.id === 'colchis')!.classification).toBe('debated');
    expect(data.locations.find((l) => l.id === 'avernus')!.classification).toBe('traditionally_identified');
    for (const id of ['underworld', 'hesperides', 'ogygia', 'aeaea']) {
      const l = data.locations.find((x) => x.id === id)!;
      expect(l.classification).toBe('mythical');
      expect(l.coords).toBeUndefined();
    }
  });

  it('has an Odysseus journey from Troy to Ithaca with a certainty on every leg', () => {
    const j = data.journeys.find((x) => x.hero === 'odysseus')!;
    expect(j.legs[0].from).toBe('troy');
    expect(j.legs[j.legs.length - 1].to).toBe('ithaca');
    expect(j.legs.every((l) => l.certainty)).toBe(true);
  });

  it('has an 8-step learning path', () => {
    expect(data.learning).toHaveLength(8);
  });
});
