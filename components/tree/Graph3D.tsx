'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import { edgeColor, tokens } from '@/lib/tokens';
import { type GLink, type GNode, type GraphProps } from './types';
import { portraitTexture } from './portraitTexture';

const typeColor: Record<string, string> = {
  primordial: tokens.color.mythic,
  titan: tokens.color.bronze,
  olympian: tokens.color.gold,
  hero: tokens.color.sibling,
  mortal: tokens.color.marble,
  creature: tokens.color.conflict,
};

const spriteCache = new Map<string, THREE.Sprite>();
function labelSprite(text: string, color: string): THREE.Sprite {
  const key = text + color;
  const hit = spriteCache.get(key);
  if (hit) return hit.clone();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const font = '600 44px Inter, system-ui, sans-serif';
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 24;
  canvas.width = w;
  canvas.height = 64;
  ctx.font = font;
  ctx.fillStyle = 'rgba(7,9,18,0.65)';
  ctx.fillRect(0, 6, w, 52);
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 12, 33);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  sprite.scale.set(w / 11, 64 / 11, 1);
  spriteCache.set(key, sprite);
  return sprite.clone();
}

export default function Graph3D({ nodes, links, selectedId, highlightNodes, highlightLinks, reduced, onNodeClick, fitSignal }: GraphProps) {
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

  // Layered genealogy: generation fixes the vertical position, the force layout handles the rest.
  // Reuse node objects by id so positions survive filter changes; recompute only when the visible set changes.
  const cache = useRef(new Map<string, GNode>());
  const sig = nodes.map((n) => n.id + ':' + n.gen).join(',') + '|' + links.map((l) => l.id).join(',');
  const graphData = useMemo(() => {
    const ns = nodes.map((n) => {
      const prev = cache.current.get(n.id);
      // Layered 2.5D: generation fixes y, a shallow deterministic z gives depth without stacking portraits in projection.
      const z = ((n.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 7) - 3) * 9;
      const next = Object.assign(prev ?? {}, n, { fy: -n.gen * 58 + 150, fz: z }) as GNode;
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
    if (fitSignal) fg.current?.zoomToFit(reduced ? 0 : 800, 40);
  }, [fitSignal, reduced]);

  // Portrait discs need more room than dots: longer links, stronger repulsion.
  useEffect(() => {
    const g = fg.current;
    if (!g) return;
    g.d3Force('link')?.distance(40);
    g.d3Force('charge')?.strength(-140);
    g.d3ReheatSimulation();
  }, [graphData]);

  useEffect(() => {
    if (!selectedId || !fg.current) return;
    const n = graphData.nodes.find((x) => x.id === selectedId) as GNode | undefined;
    if (!n || n.x === undefined) return;
    const dist = 140;
    const r = Math.hypot(n.x, n.y ?? 0, n.z ?? 0) || 1;
    fg.current.cameraPosition(
      { x: n.x * (1 + dist / r), y: (n.y ?? 0) * (1 + dist / r), z: (n.z ?? 0) * (1 + dist / r) + 1 },
      { x: n.x, y: n.y ?? 0, z: n.z ?? 0 },
      reduced ? 0 : 1200,
    );
  }, [selectedId, graphData, reduced]);

  const dim = (id: string) => highlightNodes !== null && !highlightNodes.has(id);
  const linkDim = (l: GLink) => highlightLinks !== null && !highlightLinks.has(l.id);

  return (
    <div ref={wrap} className="h-full w-full">
      <ForceGraph3D<GNode, GLink>
        ref={fg}
        width={size.w}
        height={size.h}
        graphData={graphData}
        backgroundColor={tokens.color.cosmos}
        showNavInfo={false}
        cooldownTicks={reduced ? 60 : 200}
        cooldownTime={3500}
        warmupTicks={reduced ? 60 : 0}
        nodeRelSize={3}
        nodeVal={(n) => (n.id === selectedId ? 6 : n.type === 'primordial' || n.type === 'olympian' ? 2.4 : 1.4)}
        nodeColor={(n) => (dim(n.id) ? '#2a2d40' : n.id === selectedId ? tokens.color.marble : typeColor[n.type] ?? tokens.color.mist)}
        nodeOpacity={0.95}
        nodeLabel={(n) => `${n.name}${n.conflicted ? ' — sources disagree on parentage' : ''}`}
        nodeThreeObjectExtend={(n: GNode) => !n.img}
        nodeThreeObject={(n: GNode) => {
          const dimmed = dim(n.id);
          const label = labelSprite(n.conflicted ? `${n.name} ⚑` : n.name, dimmed ? '#4a4d60' : n.id === selectedId ? tokens.color.gold : tokens.color.marble);
          if (!n.img) {
            label.position.set(0, 8, 0);
            return label;
          }
          // Portrait disc replaces the ball; the name sits beneath it.
          const group = new THREE.Group();
          const size = n.id === selectedId ? 18 : n.type === 'primordial' || n.type === 'olympian' ? 15 : 12;
          const disc = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: portraitTexture(n.img, n.id === selectedId ? tokens.color.marble : typeColor[n.type] ?? tokens.color.gold), transparent: true, opacity: dimmed ? 0.25 : 1, depthWrite: false }),
          );
          disc.scale.set(size, size, 1);
          group.add(disc);
          label.position.set(0, -(size / 2 + 4), 0);
          group.add(label);
          return group;
        }}
        linkColor={(l) => (linkDim(l) ? '#1c1f30' : edgeColor(l.kind))}
        linkOpacity={0.7}
        linkWidth={(l) => (highlightLinks?.has(l.id) ? 1.4 : 0)}
        linkCurvature={(l) => l.curvature}
        linkDirectionalArrowLength={(l) => (l.kind === 'parent' ? 3.5 : 0)}
        linkDirectionalArrowRelPos={0.92}
        linkDirectionalArrowColor={(l) => edgeColor(l.kind)}
        linkDirectionalParticles={(l) => (reduced ? 0 : highlightLinks?.has(l.id) ? 4 : l.kind === 'conflict' ? 2 : 0)}
        linkDirectionalParticleWidth={(l) => (highlightLinks?.has(l.id) ? 2.5 : 1.5)}
        linkDirectionalParticleColor={(l) => edgeColor(l.kind)}
        linkLabel={(l) => `${l.kind} · ${l.src}`}
        onNodeClick={(n) => onNodeClick(n.id)}
        onEngineStop={() => {
          if (Date.now() < fitUntil.current) fg.current?.zoomToFit(reduced ? 0 : 800, 40);
        }}
        enableNodeDrag={false}
      />
      <span className="sr-only">3D genealogy graph of {nodes.length} figures. Use the text list below for keyboard access.</span>
    </div>
  );
}
