import { data, entitiesById, stagesById } from './data';
import type { Relationship, RelationshipKind } from './schema';

export const ALL_KINDS: RelationshipKind[] = ['parent', 'partner', 'sibling', 'conflict', 'alliance'];

/** Sources that actually appear on relationship edges, most used first. */
export const EDGE_SOURCES: { id: string; count: number }[] = Object.entries(
  data.relationships.reduce<Record<string, number>>((acc, r) => ((acc[r.source] = (acc[r.source] ?? 0) + 1), acc), {}),
)
  .map(([id, count]) => ({ id, count }))
  .sort((a, b) => b.count - a.count);

/** Entities whose parentage differs between sources — the reason source toggles exist. */
export const CONFLICTED: string[] = (() => {
  const out: string[] = [];
  for (const e of data.entities) {
    const bySource = new Map<string, Set<string>>();
    for (const r of data.relationships) if (r.kind === 'parent' && r.to === e.id) bySource.set(r.source, (bySource.get(r.source) ?? new Set()).add(r.from));
    const variants = new Set([...bySource.values()].map((s) => [...s].sort().join('+')));
    // A primordial "has no parents" in the cosmogony, so any parent edge is a rival account.
    if (variants.size > 1 || (e.type === 'primordial' && bySource.size > 0)) out.push(e.id);
  }
  return out;
})();

export function filterEdges(sources: Set<string>, kinds: Set<RelationshipKind>): Relationship[] {
  return data.relationships.filter((r) => sources.has(r.source) && kinds.has(r.kind));
}

/** Fallback generation for figures whose parents are not in the dataset, by mythic stage order. */
const STAGE_GEN = [0, 2, 3, 3, 4, 4, 5, 5];

/**
 * Genealogical depth: parentless primordials are 0, children sit one below their deepest parent.
 * Uses only the supplied (source-filtered) parent edges, so toggling sources can move a figure.
 */
export function generations(edges: Relationship[]): Map<string, number> {
  const parents = new Map<string, string[]>();
  for (const r of edges) if (r.kind === 'parent') parents.set(r.to, [...(parents.get(r.to) ?? []), r.from]);
  const gen = new Map<string, number>();
  const base = (id: string) => {
    const e = entitiesById.get(id)!;
    return e.type === 'primordial' ? 0 : STAGE_GEN[stagesById.get(e.mythicStage)?.order ?? 0] ?? 0;
  };
  const visiting = new Set<string>();
  const calc = (id: string): number => {
    if (gen.has(id)) return gen.get(id)!;
    const ps = parents.get(id);
    if (!ps?.length || visiting.has(id)) {
      const g = base(id);
      gen.set(id, g);
      return g;
    }
    visiting.add(id);
    const g = Math.max(...ps.map(calc)) + 1;
    visiting.delete(id);
    gen.set(id, g);
    return g;
  };
  for (const e of data.entities) calc(e.id);
  return gen;
}

/** Shortest path between two figures over any visible relationship (undirected). Returns edges in order. */
export function shortestPath(from: string, to: string, edges: Relationship[]): Relationship[] | null {
  if (from === to) return [];
  const adj = new Map<string, { next: string; edge: Relationship }[]>();
  for (const r of edges) {
    adj.set(r.from, [...(adj.get(r.from) ?? []), { next: r.to, edge: r }]);
    adj.set(r.to, [...(adj.get(r.to) ?? []), { next: r.from, edge: r }]);
  }
  const prev = new Map<string, { node: string; edge: Relationship }>();
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    // Prefer genealogical links when several edges tie, so paths read naturally.
    const nexts = (adj.get(cur) ?? []).sort((a, b) => Number(a.edge.kind !== 'parent') - Number(b.edge.kind !== 'parent'));
    for (const { next, edge } of nexts) {
      if (seen.has(next)) continue;
      seen.add(next);
      prev.set(next, { node: cur, edge });
      if (next === to) {
        const path: Relationship[] = [];
        let n = to;
        while (n !== from) {
          const p = prev.get(n)!;
          path.unshift(p.edge);
          n = p.node;
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

/** A figure's branch: all ancestors and descendants via parent edges, plus their partners. */
export function branchOf(id: string, edges: Relationship[]): Set<string> {
  const up = new Map<string, string[]>();
  const down = new Map<string, string[]>();
  for (const r of edges)
    if (r.kind === 'parent') {
      up.set(r.to, [...(up.get(r.to) ?? []), r.from]);
      down.set(r.from, [...(down.get(r.from) ?? []), r.to]);
    }
  const out = new Set([id]);
  const walk = (start: string, m: Map<string, string[]>) => {
    const stack = [start];
    while (stack.length) {
      const n = stack.pop()!;
      for (const x of m.get(n) ?? [])
        if (!out.has(x)) {
          out.add(x);
          stack.push(x);
        }
    }
  };
  walk(id, up);
  walk(id, down);
  for (const r of edges) if (r.kind === 'partner' && (r.from === id || r.to === id)) out.add(r.from === id ? r.to : r.from);
  return out;
}

/** Curvature per edge so parallel edges between the same pair (e.g. two sources) fan out. */
export function curvatures(edges: Relationship[]): Map<string, number> {
  const groups = new Map<string, Relationship[]>();
  for (const r of edges) {
    const key = [r.from, r.to].sort().join('|');
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const out = new Map<string, number>();
  for (const g of groups.values()) {
    if (g.length === 1) {
      out.set(g[0].id, g[0].kind === 'parent' ? 0 : 0.15);
      continue;
    }
    g.forEach((r, i) => out.set(r.id, (i - (g.length - 1) / 2) * 0.35));
  }
  return out;
}
