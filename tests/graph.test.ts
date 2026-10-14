import { describe, expect, it } from 'vitest';
import { data } from '@/lib/data';
import { ALL_KINDS, EDGE_SOURCES, CONFLICTED, branchOf, filterEdges, generations, shortestPath } from '@/lib/graph';

const all = filterEdges(new Set(EDGE_SOURCES.map((s) => s.id)), new Set(ALL_KINDS));

describe('genealogy graph', () => {
  it('places primordials at generation 0 and Zeus below Cronus', () => {
    const g = generations(all);
    expect(g.get('chaos')).toBe(0);
    expect(g.get('gaia')).toBe(0);
    expect(g.get('uranus')).toBe(1);
    expect(g.get('cronus')).toBe(2);
    expect(g.get('zeus')).toBe(3);
    expect(g.get('athena')).toBe(4);
  });

  it('moves Aphrodite when only one tradition is shown', () => {
    const hesiodOnly = filterEdges(new Set(['hesiod-theogony']), new Set(ALL_KINDS));
    const homerOnly = filterEdges(new Set(['homer-iliad']), new Set(ALL_KINDS));
    expect(generations(hesiodOnly).get('aphrodite')).toBe(2); // child of Uranus
    expect(generations(homerOnly).get('aphrodite')).toBe(4); // child of Zeus (gen 3 by stage fallback)
  });

  it('flags figures with conflicting genealogies', () => {
    expect(CONFLICTED).toEqual(expect.arrayContaining(['aphrodite', 'hephaestus', 'athena', 'dionysus', 'dione', 'eros']));
  });

  it('traces a path between any two connected figures', () => {
    const p = shortestPath('odysseus', 'gaia', all)!;
    expect(p).not.toBeNull();
    expect(p.length).toBeGreaterThan(2);
    const nodes = new Set(p.flatMap((e) => [e.from, e.to]));
    expect(nodes.has('odysseus') && nodes.has('gaia')).toBe(true);
  });

  it("connects every figure to Zeus except Hesiod's separate line of Chaos", () => {
    const unreachable = data.entities.map((e) => e.id).filter((x) => !shortestPath('zeus', x, all));
    // In the Theogony, Chaos' descendants (Night, Darkness, Aether, Day) never intermarry with Gaia's line.
    expect(unreachable.sort()).toEqual(['aether', 'chaos', 'erebus', 'hemera', 'nyx']);
  });

  it('isolates a branch with ancestors, descendants and partners', () => {
    const b = branchOf('zeus', all);
    for (const id of ['cronus', 'uranus', 'gaia', 'athena', 'heracles', 'hera']) expect(b.has(id), id).toBe(true);
    expect(b.has('odysseus')).toBe(false);
  });
});
