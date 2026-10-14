import { describe, expect, it } from 'vitest';
import { data } from '@/lib/data';
import { journeyGeometry, odysseus, placement } from '@/lib/geo';

describe('map placement', () => {
  it('never pins a mythical place without a sourced identification', () => {
    for (const l of data.locations.filter((x) => x.classification === 'mythical')) {
      const p = placement(l);
      if (l.alternatives?.length) expect(p?.kind).toBe('proposed');
      else expect(p).toBeNull();
    }
  });

  it('pins every non-mythical place at its own coordinates', () => {
    for (const l of data.locations.filter((x) => x.classification !== 'mythical')) expect(placement(l)?.kind).toBe('site');
  });

  it('marks journey legs into unlocated places as not drawable on Earth', () => {
    const g = journeyGeometry(odysseus);
    const toOgygia = g.find((x) => x.leg.to === 'ogygia')!;
    expect(toOgygia.drawable).toBe(false);
    expect(g.filter((x) => x.drawable).length).toBeGreaterThan(8);
  });
});
