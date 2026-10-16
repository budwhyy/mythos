'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { edgeColor, tokens } from '@/lib/tokens';
import type { GLink, GNode, GraphProps } from './types';
import { portraitImage } from './portraitTexture';

const DASH: Record<string, number[] | null> = { parent: null, partner: [6, 3], sibling: [1, 3], conflict: [8, 3, 2, 3], alliance: [3, 3] };

const typeColor: Record<string, string> = {
  primordial: tokens.color.mythic,
  titan: tokens.color.bronze,
  olympian: tokens.color.gold,
  hero: tokens.color.sibling,
  mortal: tokens.color.marble,
  creature: tokens.color.conflict,
};

/** 2D fallback: same data and interactions on a canvas, with dashed line styles per relationship kind. */
export default function Graph2D({ nodes, links, selectedId, highlightNodes, highlightLinks, reduced, onNodeClick, fitSignal }: GraphProps) {
  const fg = useRef<ForceGraphMethods<GNode, GLink> | undefined>(undefined);
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reuse node objects by id so positions survive filter changes; recompute only when the visible set changes.
  const cache = useRef(new Map<string, GNode>());
  const sig = nodes.map((n) => n.id + ':' + n.gen).join(',') + '|' + links.map((l) => l.id).join(',');
  const graphData = useMemo(() => {
    const ns = nodes.map((n) => {
      const prev = cache.current.get(n.id);
      const next = Object.assign(prev ?? {}, n, { fy: n.gen * 95 }) as GNode;
      cache.current.set(n.id, next);
      return next;
    });
    return { nodes: ns, links: links.map((l) => ({ ...l })) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  // Refit on every engine stop for a few seconds after the data changes (the force reheat below settles in stages).
  const fitUntil = useRef(0);
  useEffect(() => {
    fitUntil.current = Date.now() + 8000;
  }, [graphData]);
  useEffect(() => {
    if (fitSignal) fg.current?.zoomToFit(reduced ? 0 : 600, 30);
  }, [fitSignal, reduced]);

  useEffect(() => {
    const g = fg.current;
    if (!g) return;
    g.d3Force('link')?.distance(70);
    g.d3Force('charge')?.strength(-260);
    g.d3ReheatSimulation();
  }, [graphData]);

  useEffect(() => {
    if (!selectedId || !fg.current) return;
    const n = graphData.nodes.find((x) => x.id === selectedId) as GNode | undefined;
    if (n?.x !== undefined) fg.current.centerAt(n.x, n.y, reduced ? 0 : 600);
  }, [selectedId, graphData, reduced]);

  const dim = (id: string) => highlightNodes !== null && !highlightNodes.has(id);

  return (
    <div ref={wrap} className="h-full w-full">
      <ForceGraph2D<GNode, GLink>
        ref={fg}
        width={size.w}
        height={size.h}
        graphData={graphData}
        backgroundColor={tokens.color.cosmos}
        cooldownTicks={reduced ? 80 : 200}
        cooldownTime={3500}
        warmupTicks={reduced ? 80 : 0}
        nodeRelSize={4}
        linkColor={(l) => (highlightLinks && !highlightLinks.has(l.id) ? '#1f2234' : edgeColor(l.kind))}
        linkWidth={(l) => (highlightLinks?.has(l.id) ? 3 : l.kind === 'parent' ? 1.2 : 0.8)}
        linkLineDash={(l) => DASH[l.kind]}
        linkCurvature={(l) => l.curvature}
        linkDirectionalArrowLength={(l) => (l.kind === 'parent' ? 4 : 0)}
        linkDirectionalArrowRelPos={0.9}
        linkLabel={(l) => `${l.kind} · ${l.src}`}
        nodeLabel={(n) => n.name}
        nodeCanvasObject={(n, ctx, scale) => {
          const img = n.img ? portraitImage(n.img) : null;
          const r = img ? (n.id === selectedId ? 13 : 9) : n.id === selectedId ? 7 : 4.5;
          ctx.beginPath();
          ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
          ctx.fillStyle = dim(n.id) ? '#2a2d40' : typeColor[n.type] ?? tokens.color.mist;
          ctx.fill();
          if (img && img.complete && img.naturalWidth) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(n.x!, n.y!, r - 1, 0, 2 * Math.PI);
            ctx.clip();
            ctx.globalAlpha = dim(n.id) ? 0.25 : 1;
            ctx.drawImage(img, n.x! - r, n.y! - r, r * 2, r * 2);
            ctx.restore();
            ctx.beginPath();
            ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
            ctx.lineWidth = 1.5 / scale;
            ctx.strokeStyle = n.id === selectedId ? tokens.color.marble : typeColor[n.type] ?? tokens.color.gold;
            ctx.stroke();
          } else if (n.id === selectedId) {
            ctx.lineWidth = 2 / scale;
            ctx.strokeStyle = tokens.color.marble;
            ctx.stroke();
          }
          const fontSize = Math.max(10 / scale, 3);
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = dim(n.id) ? '#4a4d60' : n.id === selectedId ? tokens.color.gold : tokens.color.marble;
          ctx.fillText(n.conflicted ? `${n.name} ⚑` : n.name, n.x!, n.y! + r + 1.5);
        }}
        nodePointerAreaPaint={(n, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x!, n.y!, n.img ? 13 : 8, 0, 2 * Math.PI);
          ctx.fill();
        }}
        onNodeClick={(n) => onNodeClick(n.id)}
        onEngineStop={() => {
          if (Date.now() < fitUntil.current) fg.current?.zoomToFit(reduced ? 0 : 600, 30);
        }}
        enableNodeDrag={false}
      />
    </div>
  );
}
