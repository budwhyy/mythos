'use client';

import { useMemo, useState } from 'react';
import { cite, data, entitiesById, stagesById } from '@/lib/data';
import { ALL_KINDS, EDGE_SOURCES, filterEdges, shortestPath } from '@/lib/graph';
import { useStore } from '@/lib/store';
import { edgeColor, tokens } from '@/lib/tokens';
import PathSteps from './PathSteps';
import type { Relationship } from '@/lib/schema';

const SORTED = [...data.entities].sort((a, b) => a.name.localeCompare(b.name));
const ALL_EDGES = filterEdges(new Set(EDGE_SOURCES.map((s) => s.id)), new Set(ALL_KINDS));
const PRESETS: [string, string][] = [
  ['odysseus', 'zeus'],
  ['aphrodite', 'hephaestus'],
  ['achilles', 'uranus'],
  ['persephone', 'dionysus'],
  ['prometheus', 'heracles'],
];

function PathDiagram({ from, path }: { from: string; path: Relationship[] }) {
  const ids = [from];
  for (const r of path) ids.push(r.from === ids[ids.length - 1] ? r.to : r.from);
  const step = 130;
  const w = Math.max(320, (ids.length - 1) * step + 120);
  return (
    <div className="overflow-x-auto">
      <svg width={w} height={90} role="img" aria-label={`Path: ${ids.map((i) => entitiesById.get(i)?.name).join(' to ')}`}>
        {path.map((r, i) => (
          <g key={r.id + i}>
            <line
              x1={60 + i * step}
              x2={60 + (i + 1) * step}
              y1={40}
              y2={40}
              stroke={edgeColor(r.kind)}
              strokeWidth={2.5}
              strokeDasharray={r.kind === 'parent' ? undefined : r.kind === 'partner' ? '6 3' : r.kind === 'sibling' ? '1 3' : r.kind === 'conflict' ? '8 3 2 3' : '3 3'}
            />
            <text x={60 + i * step + step / 2} y={32} textAnchor="middle" fontSize={10} fill={edgeColor(r.kind)}>
              {r.kind}
            </text>
          </g>
        ))}
        {ids.map((id, i) => (
          <g key={id + i}>
            <circle cx={60 + i * step} cy={40} r={9} fill={tokens.color.cosmos} stroke={i === 0 || i === ids.length - 1 ? tokens.color.gold : tokens.color.marble} strokeWidth={2} />
            <text x={60 + i * step} y={68} textAnchor="middle" fontSize={12} fill={tokens.color.marble}>
              {entitiesById.get(id)?.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function RelationshipView() {
  const [a, setA] = useState('odysseus');
  const [b, setB] = useState('zeus');
  const select = useStore((s) => s.select);

  const path = useMemo(() => shortestPath(a, b, ALL_EDGES), [a, b]);
  const direct = data.relationships.filter((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a));
  const sharedEvents = data.mythicEvents.filter((m) => m.participants.includes(a) && m.participants.includes(b));
  const sharedPlaces = data.locations.filter((l) => l.linkedEntities.includes(a) && l.linkedEntities.includes(b));
  const A = entitiesById.get(a)!;
  const B = entitiesById.get(b)!;

  const picker = (id: string, value: string, set: (v: string) => void, label: string) => (
    <div>
      <label htmlFor={id} className="block text-xs text-mist">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => set(e.target.value)} className="rounded-md border border-gold/30 bg-cosmos-3 px-2 py-1.5 text-sm">
        {SORTED.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <header>
        <h1 className="font-display text-4xl text-gold">Relationship</h1>
        <p className="text-marble/80">Pick any two figures to see how the sources connect them — by family, partnership, conflict or alliance — and which stories they share.</p>
      </header>

      <div className="panel flex flex-wrap items-end gap-3 p-3">
        {picker('rel-a', a, setA, 'First figure')}
        <button
          type="button"
          className="btn"
          aria-label="Swap figures"
          onClick={() => {
            setA(b);
            setB(a);
          }}
        >
          ⇄
        </button>
        {picker('rel-b', b, setB, 'Second figure')}
        <div className="flex flex-wrap gap-1">
          <span className="w-full text-xs text-mist">Try:</span>
          {PRESETS.map(([x, y]) => (
            <button
              key={x + y}
              type="button"
              className="chip hover:bg-cosmos-3"
              onClick={() => {
                setA(x);
                setB(y);
              }}
            >
              {entitiesById.get(x)?.name} ↔ {entitiesById.get(y)?.name}
            </button>
          ))}
        </div>
      </div>

      <section className="panel space-y-3 p-4" aria-live="polite" data-testid="relationship-result">
        <h2 className="font-display text-2xl text-gold">
          {A.name} ↔ {B.name}
        </h2>
        {a === b ? (
          <p className="text-mist">Choose two different figures.</p>
        ) : path ? (
          <>
            <p className="text-sm text-marble/85">
              Shortest chain: <strong>{path.length}</strong> step{path.length === 1 ? '' : 's'}. Every link is cited; links from different sources may not agree with each other.
            </p>
            <PathDiagram from={a} path={path} />
            <PathSteps from={a} path={path} />
          </>
        ) : (
          <p className="text-mist">
            The sources in MYTHOS give no chain of relationships between these two. (In Hesiod, the descendants of Chaos — Night, Darkness, Aether, Day — form a separate line.)
          </p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="panel p-3">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Direct links</h3>
          {direct.length ? (
            <ul className="space-y-1 text-sm">
              {direct.map((r) => (
                <li key={r.id}>
                  <span style={{ color: edgeColor(r.kind) }}>{r.kind}</span> <span className="text-xs text-mist">— {cite(r.source, r.ref)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mist">None recorded.</p>
          )}
        </section>
        <section className="panel p-3">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Shared stories</h3>
          {sharedEvents.length ? (
            <ul className="space-y-1 text-sm">
              {sharedEvents.map((m) => (
                <li key={m.id}>
                  <button type="button" className="text-left text-mythic hover:underline" onClick={() => select({ kind: 'mythicEvent', id: m.id })}>
                    {m.name}
                  </button>
                  <span className="text-xs text-mist"> · {stagesById.get(m.stage)?.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mist">No shared event in this dataset.</p>
          )}
        </section>
        <section className="panel p-3">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Shared places</h3>
          {sharedPlaces.length ? (
            <ul className="space-y-1 text-sm">
              {sharedPlaces.map((l) => (
                <li key={l.id}>
                  <button type="button" className="text-left hover:underline" onClick={() => select({ kind: 'location', id: l.id })}>
                    {l.ancientName}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mist">No shared place in this dataset.</p>
          )}
        </section>
      </div>
    </div>
  );
}
