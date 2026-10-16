'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { use2D, useIsMobile, useReducedMotion } from '@/lib/hooks';
import { data, entitiesById, sourcesById } from '@/lib/data';
import { ALL_KINDS, CONFLICTED, EDGE_SOURCES, branchOf, curvatures, filterEdges, generations, shortestPath } from '@/lib/graph';
import { edgeColor } from '@/lib/tokens';
import type { RelationshipKind } from '@/lib/schema';
import PathSteps from '../PathSteps';
import type { GLink, GNode } from './types';

const loading = () => <div className="flex h-full items-center justify-center text-mist">Weaving the family tree…</div>;
const Graph3D = dynamic(() => import('./Graph3D'), { ssr: false, loading });
const Graph2D = dynamic(() => import('./Graph2D'), { ssr: false, loading });

const DASH: Record<RelationshipKind, string> = { parent: '', partner: '6 3', sibling: '1 3', conflict: '8 3 2 3', alliance: '3 3' };
const SORTED = [...data.entities].sort((a, b) => a.name.localeCompare(b.name));
const DEFAULT_GEN = 4;

export default function FamilyTreeView() {
  const selection = useStore((s) => s.selection);
  const select = useStore((s) => s.select);
  const { use2D: twoD, reason, mounted } = use2D();
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const [controlsOpen, setControlsOpen] = useState(false);

  const [kinds, setKinds] = useState<Set<RelationshipKind>>(new Set(ALL_KINDS));
  const [sources, setSources] = useState<Set<string>>(new Set(EDGE_SOURCES.map((s) => s.id)));
  const [maxGen, setMaxGen] = useState(DEFAULT_GEN);
  const [isolate, setIsolate] = useState(false);
  const [pathFrom, setPathFrom] = useState('');
  const [pathTo, setPathTo] = useState('');
  const [fitSignal, setFitSignal] = useState(0);

  const selectedId = selection?.kind === 'entity' ? selection.id : null;

  const edges = useMemo(() => filterEdges(sources, kinds), [sources, kinds]);
  const gens = useMemo(() => generations(filterEdges(sources, new Set(['parent']))), [sources]);
  const maxPossibleGen = Math.max(...gens.values());
  const path = useMemo(() => (pathFrom && pathTo ? shortestPath(pathFrom, pathTo, edges) : null), [pathFrom, pathTo, edges]);
  const pathNodes = useMemo(() => (path ? new Set(path.flatMap((r) => [r.from, r.to]).concat(pathFrom, pathTo)) : null), [path, pathFrom, pathTo]);

  const branch = useMemo(() => (isolate && selectedId ? branchOf(selectedId, edges) : null), [isolate, selectedId, edges]);

  const { nodes, links, hidden } = useMemo(() => {
    const visible = new Set<string>();
    for (const e of data.entities) {
      if (branch) {
        if (branch.has(e.id)) visible.add(e.id);
      } else if ((gens.get(e.id) ?? 0) <= maxGen) visible.add(e.id);
    }
    pathNodes?.forEach((n) => visible.add(n));
    if (selectedId) visible.add(selectedId);
    const curv = curvatures(edges);
    const nodes: GNode[] = [...visible].map((id) => {
      const e = entitiesById.get(id)!;
      return { id, name: e.name, type: e.type, gen: gens.get(id) ?? 0, conflicted: CONFLICTED.includes(id), img: e.image?.thumb ?? e.image?.src };
    });
    const links: GLink[] = edges
      .filter((r) => visible.has(r.from) && visible.has(r.to))
      .map((r) => ({ id: r.id, source: r.from, target: r.to, kind: r.kind, src: sourcesById.get(r.source)?.work ?? r.source, curvature: curv.get(r.id) ?? 0 }));
    return { nodes, links, hidden: data.entities.length - visible.size };
  }, [edges, gens, maxGen, branch, pathNodes, selectedId]);

  const { highlightNodes, highlightLinks } = useMemo(() => {
    if (path && pathNodes) return { highlightNodes: pathNodes, highlightLinks: new Set(path.map((r) => r.id)) };
    if (selectedId) {
      const touching = links.filter((l) => l.source === selectedId || l.target === selectedId);
      return { highlightNodes: new Set([selectedId, ...touching.flatMap((l) => [l.source as string, l.target as string])]), highlightLinks: new Set(touching.map((l) => l.id)) };
    }
    return { highlightNodes: null, highlightLinks: null };
  }, [path, pathNodes, selectedId, links]);

  const toggle = <T,>(set: Set<T>, v: T, setter: (s: Set<T>) => void) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    setter(n);
  };

  const graphProps = { nodes, links, selectedId, highlightNodes, highlightLinks, reduced, onNodeClick: (id: string) => select({ kind: 'entity', id }), fitSignal };

  return (
    <div className="flex flex-col gap-3 p-2 sm:p-3 lg:flex-row">
      <section className="panel order-2 p-3 lg:order-1 lg:w-72 lg:shrink-0" aria-labelledby="tree-controls">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 id="tree-controls" className="font-display hidden text-3xl text-gold lg:block">
              Family Tree
            </h1>
            <p className="text-xs text-mist">
              {nodes.length} of {data.entities.length} figures shown · {links.length} relationships.{' '}
              {isMobile ? 'Drag to rotate, pinch to zoom.' : 'Drag to rotate, scroll to zoom, right-drag to pan.'} ⚑ = sources disagree.
            </p>
          </div>
          {isMobile ? (
            <button type="button" className="btn shrink-0" aria-expanded={controlsOpen} aria-controls="tree-controls-body" onClick={() => setControlsOpen((o) => !o)}>
              {controlsOpen ? 'Hide filters' : 'Filters & path'}
            </button>
          ) : null}
        </div>
        <div id="tree-controls-body" className={`mt-4 space-y-4 ${isMobile && !controlsOpen ? 'hidden' : ''}`}>

        <fieldset>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-mist">Relationships</legend>
          <ul className="space-y-1">
            {ALL_KINDS.map((k) => (
              <li key={k}>
                <label className="flex cursor-pointer items-center gap-2 text-sm capitalize">
                  <input type="checkbox" checked={kinds.has(k)} onChange={() => toggle(kinds, k, setKinds)} className="accent-[#C9A227]" />
                  <svg width="34" height="8" aria-hidden="true">
                    <line x1="0" y1="4" x2="34" y2="4" stroke={edgeColor(k)} strokeWidth="2.5" strokeDasharray={DASH[k]} />
                  </svg>
                  {k}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-mist">Sources (genealogies differ)</legend>
          <ul className="max-h-44 space-y-1 overflow-auto pr-1">
            {EDGE_SOURCES.map(({ id, count }) => {
              const s = sourcesById.get(id)!;
              return (
                <li key={id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={sources.has(id)} onChange={() => toggle(sources, id, setSources)} className="accent-[#C9A227]" />
                    <span>
                      {s.author}, <em>{s.work}</em> <span className="text-xs text-mist">({count})</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex flex-wrap gap-1">
            <button type="button" className="btn text-xs" onClick={() => setSources(new Set(['hesiod-theogony']))}>
              Hesiod only
            </button>
            <button type="button" className="btn text-xs" onClick={() => setSources(new Set(['homer-iliad', 'homer-odyssey']))}>
              Homer only
            </button>
            <button type="button" className="btn text-xs" onClick={() => setSources(new Set(EDGE_SOURCES.map((s) => s.id)))}>
              All
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-mist">Generations</legend>
          <label htmlFor="gen-range" className="text-sm">
            Show down to generation {maxGen}
          </label>
          <input id="gen-range" type="range" min={0} max={maxPossibleGen} value={maxGen} onChange={(e) => setMaxGen(Number(e.target.value))} className="w-full accent-[#C9A227]" />
          <div className="flex gap-1">
            <button type="button" className="btn text-xs" onClick={() => setMaxGen(Math.max(0, maxGen - 1))}>
              Collapse
            </button>
            <button type="button" className="btn text-xs" onClick={() => setMaxGen(Math.min(maxPossibleGen, maxGen + 1))}>
              Expand
            </button>
            <button type="button" className="btn text-xs" onClick={() => setMaxGen(maxPossibleGen)}>
              All
            </button>
          </div>
          {hidden > 0 && !branch ? <p className="mt-1 text-xs text-mist">{hidden} figures in deeper generations are not loaded yet.</p> : null}
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-mist">Focus</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isolate} disabled={!selectedId} onChange={(e) => setIsolate(e.target.checked)} className="accent-[#C9A227]" />
            Isolate branch {selectedId ? `of ${entitiesById.get(selectedId)?.name}` : '(select a figure)'}
          </label>
          <button type="button" className="btn mt-2 text-xs" onClick={() => setFitSignal((n) => n + 1)}>
            Zoom to fit
          </button>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-mist">Trace a path</legend>
          <div className="space-y-1">
            <label className="block text-xs text-mist" htmlFor="path-from">
              From
            </label>
            <select id="path-from" value={pathFrom} onChange={(e) => setPathFrom(e.target.value)} className="w-full rounded-md border border-gold/30 bg-cosmos-3 px-2 py-1 text-sm">
              <option value="">— choose —</option>
              {SORTED.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <label className="block text-xs text-mist" htmlFor="path-to">
              To
            </label>
            <select id="path-to" value={pathTo} onChange={(e) => setPathTo(e.target.value)} className="w-full rounded-md border border-gold/30 bg-cosmos-3 px-2 py-1 text-sm">
              <option value="">— choose —</option>
              {SORTED.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            {pathFrom || pathTo ? (
              <button
                type="button"
                className="btn text-xs"
                onClick={() => {
                  setPathFrom('');
                  setPathTo('');
                }}
              >
                Clear path
              </button>
            ) : null}
          </div>
        </fieldset>
        </div>
      </section>

      <div className="order-1 flex min-w-0 flex-1 flex-col gap-3 lg:order-2">
        <h2 className="font-display px-1 text-3xl text-gold lg:hidden" aria-hidden="true">
          Family Tree
        </h2>
        <div className="panel relative h-[55dvh] min-h-[320px] overflow-hidden lg:h-[62vh] lg:min-h-[380px]" data-testid="family-graph">
          {mounted ? twoD ? <Graph2D {...graphProps} /> : <Graph3D {...graphProps} /> : null}
          {reason ? <p className="absolute bottom-2 left-2 rounded bg-cosmos/80 px-2 py-1 text-xs text-mist">{reason}</p> : null}
        </div>

        {pathFrom && pathTo ? (
          <section className="panel p-3" aria-live="polite">
            <h2 className="font-display mb-2 text-xl text-gold">
              Path: {entitiesById.get(pathFrom)?.name} → {entitiesById.get(pathTo)?.name}
            </h2>
            {path === null ? (
              <p className="text-sm text-mist">
                No connection with the relationships and sources currently shown. Try enabling more sources or kinds. Note that in Hesiod the line of Chaos (Night,
                Darkness, Aether, Day) never joins the line of Gaia — they are separate from the start.
              </p>
            ) : path.length === 0 ? (
              <p className="text-sm text-mist">Same figure.</p>
            ) : (
              <PathSteps from={pathFrom} path={path} />
            )}
          </section>
        ) : null}

        <details className="panel p-3" open={mounted && twoD}>
          <summary className="cursor-pointer font-display text-xl text-gold">Figures by generation — text view</summary>
          <div className="mt-2 space-y-2">
            {Array.from({ length: maxPossibleGen + 1 }, (_, g) => g).map((g) => {
              const inGen = nodes.filter((n) => n.gen === g).sort((a, b) => a.name.localeCompare(b.name));
              if (!inGen.length) return null;
              return (
                <div key={g}>
                  <h3 className="text-xs uppercase tracking-wide text-mist">Generation {g}</h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {inGen.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={`chip hover:bg-cosmos-3 ${selectedId === n.id ? 'text-gold' : 'text-marble'}`}
                          aria-pressed={selectedId === n.id}
                          onClick={() => select({ kind: 'entity', id: n.id })}
                        >
                          {n.name}
                          {n.conflicted ? <span aria-label="sources disagree"> ⚑</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </details>
      </div>
    </div>
  );
}
