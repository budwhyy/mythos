'use client';

import { useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { data, stagesOrdered } from '@/lib/data';
import { useStore } from '@/lib/store';
import { useIsMobile } from '@/lib/hooks';
import { tokens } from '@/lib/tokens';

export const stagePos = (i: number): [number, number, number] => [i * 12, Math.sin(i * 0.8) * 2.5, -Math.cos(i * 0.5) * 4];

/** Deterministic pseudo-random so constellations are stable between renders. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type Star = { id: string; kind: 'entity' | 'mythicEvent'; label: string; pos: [number, number, number] };
type Constellation = { stage: (typeof stagesOrdered)[number]; index: number; center: [number, number, number]; stars: Star[] };
type Label = { key: string; pos: [number, number, number]; stageIndex: number };

const CONSTELLATIONS: Constellation[] = stagesOrdered.map((s, i) => {
  const c = stagePos(i);
  const figures = data.entities.filter((e) => e.mythicStage === s.id).map((e) => ({ id: e.id, kind: 'entity' as const, label: e.name }));
  const events = data.mythicEvents.filter((m) => m.stage === s.id).map((m) => ({ id: m.id, kind: 'mythicEvent' as const, label: m.name }));
  const items = [...events, ...figures];
  const stars: Star[] = items.map((it, k) => {
    const a = (k / Math.max(1, items.length)) * Math.PI * 2 + rand(i * 31 + k) * 0.6;
    const r = 1.6 + rand(i * 17 + k * 3) * 2.4;
    return { ...it, pos: [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.75, c[2] + (rand(k + i) - 0.5) * 2] };
  });
  return { stage: s, index: i, center: c, stars };
});

const LABELS: Label[] = CONSTELLATIONS.flatMap((c) => [
  { key: `stage:${c.stage.id}`, pos: [c.center[0], c.center[1] + 2.9, c.center[2]] as [number, number, number], stageIndex: c.index },
  ...c.stars.map((s) => ({ key: `star:${s.id}`, pos: s.pos, stageIndex: c.index })),
]);

function CameraRig({ focusIndex, reduced, distance }: { focusIndex: number; reduced: boolean; distance: number }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(...stagePos(0)));
  const tPos = useMemo(() => new THREE.Vector3(), []);
  const tLook = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const c = stagePos(focusIndex);
    tPos.set(c[0] - 1.5, c[1] + 1.2, c[2] + distance);
    tLook.set(c[0], c[1] + 0.6, c[2]);
    const k = reduced ? 1 : 1 - Math.exp(-dt * 1.6);
    camera.position.lerp(tPos, k);
    look.current.lerp(tLook, k);
    camera.lookAt(look.current);
  });
  return null;
}

type Placed = { el: HTMLElement; x: number; y: number; w: number; h: number; priority: number; opacity: string };

const GAP = 2;
/** Offsets to try, in order: in place, then below/above by 1–3 label heights, then beside, then diagonal. */
const CANDIDATES: [number, number][] = [
  [0, 0], [0, 1], [0, -1], [0, 2], [0, -2], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 3], [0, -3], [1, 2], [-1, 2],
  [1, -2], [-1, -2], [2, 0], [-2, 0], [0, 4], [0, -4], [2, 1], [-2, 1], [2, -1], [-2, -1], [1, 3], [-1, 3],
];

/**
 * Projects label anchors to screen space every frame and moves the matching DOM nodes.
 * Star labels of the focused stage then go through a collision pass: sorted top-to-bottom,
 * event labels take precedence over figure labels, and an overlapping label is nudged
 * to the first free slot in a ring of candidate offsets. Figures take precedence over events and the
 * focused stage's title block is treated as an obstacle. A label with no free slot is hidden.
 */
function LabelProjector({ refs, focusIndex }: { refs: MutableRefObject<Map<string, HTMLElement>>; focusIndex: number }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const stars = useMemo<Placed[]>(() => [], []);
  const obstacles = useMemo<Placed[]>(() => [], []);
  useFrame(() => {
    stars.length = 0;
    obstacles.length = 0;
    for (const l of LABELS) {
      const el = refs.current.get(l.key);
      if (!el) continue;
      v.set(...l.pos).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
      const isStage = l.key.startsWith('stage:');
      const show = visible && (isStage ? Math.abs(l.stageIndex - focusIndex) <= 1 : l.stageIndex === focusIndex);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      if (!show) {
        el.style.opacity = '0';
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        continue;
      }
      if (isStage) {
        el.style.opacity = l.stageIndex !== focusIndex ? '0.55' : '1';
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        if (l.stageIndex === focusIndex) obstacles.push({ el, x, y, w: el.offsetWidth, h: el.offsetHeight, priority: -1, opacity: '1' });
        continue;
      }
      stars.push({ el, x, y, w: el.offsetWidth, h: el.offsetHeight || 16, priority: el.dataset.kind === 'entity' ? 0 : 1, opacity: '1' });
    }

    // Collision pass over the focused stage's star labels: each label tries a ring of
    // candidate offsets around its anchor and takes the first slot free of already-placed labels.
    stars.sort((a, b) => a.priority - b.priority || a.y - b.y);
    const placed: Placed[] = [...obstacles];
    const free = (x: number, y: number, s: Placed) =>
      placed.every((p) => Math.abs(x - p.x) >= (s.w + p.w) / 2 + GAP || Math.abs(y - p.y) >= (s.h + p.h) / 2 + GAP);
    for (const s of stars) {
      const ax = s.x;
      const ay = s.y;
      let ok = false;
      for (const [dx, dy] of CANDIDATES) {
        const x = ax + dx * (s.w / 2 + 6);
        const y = ay + dy * (s.h + GAP);
        if (x - s.w / 2 < 0 || x + s.w / 2 > size.width) continue;
        if (free(x, y, s)) {
          s.x = x;
          s.y = y;
          ok = true;
          break;
        }
      }
      if (ok) placed.push(s);
      else s.opacity = '0';
      s.el.style.opacity = s.opacity;
      s.el.style.transform = `translate(-50%, -50%) translate(${s.x}px, ${s.y}px)`;
    }
  });
  return null;
}

function ChaosNebula({ center, reduced }: { center: [number, number, number]; reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const n = 900;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.pow(rand(i), 0.6) * 3.4;
      const a = rand(i + 1000) * Math.PI * 2;
      const y = (rand(i + 2000) - 0.5) * 1.4;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = y * (1 - r / 4);
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (ref.current && !reduced) ref.current.rotation.y += dt * 0.08;
  });
  return (
    <points ref={ref} geometry={geom} position={center} rotation={[0.4, 0, 0.15]}>
      <pointsMaterial size={0.05} color={tokens.color.mythic} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

const PATH = stagesOrdered.map((_, i) => new THREE.Vector3(...stagePos(i)));

function Scene({ reduced, focusIndex, labelRefs, distance }: { reduced: boolean; focusIndex: number; labelRefs: MutableRefObject<Map<string, HTMLElement>>; distance: number }) {
  const selection = useStore((s) => s.selection);
  const select = useStore((s) => s.select);
  const setStageFocus = useStore((s) => s.setStageFocus);

  return (
    <>
      <color attach="background" args={[tokens.color.cosmos]} />
      <fog attach="fog" args={[tokens.color.cosmos, 18, 46]} />
      <Stars radius={80} depth={40} count={reduced ? 1500 : 3500} factor={3} saturation={0} fade speed={reduced ? 0 : 0.4} />
      <Line points={PATH} color={tokens.color.mythic} lineWidth={1} transparent opacity={0.25} dashed dashSize={0.4} gapSize={0.4} />
      <ChaosNebula center={stagePos(0)} reduced={reduced} />
      {CONSTELLATIONS.map(({ stage, index, center, stars }) => {
        const focused = index === focusIndex;
        return (
          <group key={stage.id}>
            <mesh
              position={center}
              onClick={(e) => {
                e.stopPropagation();
                setStageFocus(stage.id);
                select({ kind: 'stage', id: stage.id });
              }}
            >
              <sphereGeometry args={[0.28, 24, 24]} />
              <meshBasicMaterial color={focused ? tokens.color.gold : tokens.color.mythic} />
            </mesh>
            {stars.length > 1 ? (
              <Line points={stars.map((s) => s.pos)} color={tokens.color.gold} lineWidth={0.6} transparent opacity={focused ? 0.35 : 0.1} />
            ) : null}
            {stars.map((s) => (
              <mesh
                key={s.id}
                position={s.pos}
                scale={selection?.id === s.id ? 1.8 : 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setStageFocus(stage.id);
                  select({ kind: s.kind, id: s.id });
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = '')}
              >
                <sphereGeometry args={[s.kind === 'mythicEvent' ? 0.11 : 0.08, 12, 12]} />
                <meshBasicMaterial color={s.kind === 'mythicEvent' ? tokens.color.marble : tokens.color.gold} transparent opacity={focused ? 1 : 0.45} />
              </mesh>
            ))}
          </group>
        );
      })}
      <CameraRig focusIndex={focusIndex} reduced={reduced} distance={distance} />
      <LabelProjector refs={labelRefs} focusIndex={focusIndex} />
    </>
  );
}

export default function MythicSequence3D({ reduced }: { reduced: boolean }) {
  const stageFocus = useStore((s) => s.stageFocus);
  const selection = useStore((s) => s.selection);
  const focusIndex = Math.max(0, stagesOrdered.findIndex((s) => s.id === stageFocus));
  const labelRefs = useRef(new Map<string, HTMLElement>());
  const isMobile = useIsMobile();
  const start = stagePos(0);
  const setRef = (key: string) => (el: HTMLElement | null) => {
    if (el) labelRefs.current.set(key, el);
    else labelRefs.current.delete(key);
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [start[0] - 8, start[1] + 6, start[2] + 34], fov: 50, near: 0.1, far: 200 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        aria-hidden="true"
      >
        <Scene reduced={reduced} focusIndex={focusIndex} labelRefs={labelRefs} distance={isMobile ? 15 : 11} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {CONSTELLATIONS.map((c) => (
          <div
            key={c.stage.id}
            ref={setRef(`stage:${c.stage.id}`)}
            className="absolute left-0 top-0 text-center transition-opacity duration-500"
            style={{ opacity: 0, textShadow: '0 0 8px #000' }}
          >
            <div className={`font-display whitespace-nowrap ${c.index === focusIndex ? 'text-2xl text-gold sm:text-4xl' : 'text-lg text-marble/80 sm:text-xl'}`}>{c.stage.name}</div>
            {c.index === focusIndex ? <div className="font-display whitespace-nowrap text-base italic text-marble/85 sm:text-lg">{c.stage.tagline}</div> : null}
          </div>
        ))}
        {CONSTELLATIONS.flatMap((c) =>
          c.stars.map((s) => (
            <span
              key={s.id}
              ref={setRef(`star:${s.id}`)}
              data-kind={s.kind}
              className={`absolute left-0 top-0 whitespace-nowrap rounded px-1 text-[11px] transition-opacity duration-500 sm:text-xs ${
                s.kind === 'mythicEvent' ? 'max-w-[9rem] truncate italic text-marble sm:max-w-none' : 'text-gold'
              } ${selection?.id === s.id ? 'bg-gold/30' : ''}`}
              style={{ opacity: 0, textShadow: '0 0 4px #000', marginTop: 14 }}
            >
              {s.label}
            </span>
          )),
        )}
      </div>
    </div>
  );
}
