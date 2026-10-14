'use client';

import { cite, entitiesById } from '@/lib/data';
import { useStore } from '@/lib/store';
import { edgeColor } from '@/lib/tokens';
import type { Relationship } from '@/lib/schema';

const verb = (r: Relationship, forward: boolean) => {
  switch (r.kind) {
    case 'parent':
      return forward ? 'is a parent of' : 'is a child of';
    case 'partner':
      return 'is the partner of';
    case 'sibling':
      return 'is a sibling of';
    case 'conflict':
      return 'is in conflict with';
    case 'alliance':
      return 'is allied with';
  }
};

/** Renders a relationship path as a readable chain, one sourced step per line. */
export default function PathSteps({ from, path }: { from: string; path: Relationship[] }) {
  const select = useStore((s) => s.select);
  let cur = from;
  return (
    <ol className="space-y-2" aria-label="Relationship path">
      {path.map((r, i) => {
        const forward = r.from === cur;
        const next = forward ? r.to : r.from;
        const a = entitiesById.get(cur)!;
        const b = entitiesById.get(next)!;
        cur = next;
        return (
          <li key={r.id + i} className="rounded-md border-l-2 bg-cosmos-3/60 p-2 text-sm" style={{ borderColor: edgeColor(r.kind) }}>
            <span className="mr-1 text-xs text-mist">{i + 1}.</span>
            <button type="button" className="text-gold hover:underline" onClick={() => select({ kind: 'entity', id: a.id })}>
              {a.name}
            </button>{' '}
            <span style={{ color: edgeColor(r.kind) }}>{verb(r, forward)}</span>{' '}
            <button type="button" className="text-gold hover:underline" onClick={() => select({ kind: 'entity', id: b.id })}>
              {b.name}
            </button>
            <div className="text-xs text-mist">
              Source: {cite(r.source, r.ref)}
              {r.note ? ` — ${r.note}` : ''}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
