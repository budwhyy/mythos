'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { hasWebGL, useIsMobile, useMounted, useReducedMotion } from '@/lib/hooks';
import { classificationLabel, data, locationsById } from '@/lib/data';
import { activeIn, journeyGeometry, odysseus } from '@/lib/geo';
import { tokens } from '@/lib/tokens';
import type { Classification } from '@/lib/schema';
import SymbolicMap from './SymbolicMap';
import type { MapLayer } from './MapCanvas';

const MapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-mist">Unrolling the map…</div>,
});

const LAYERS: { id: MapLayer; label: string; hint: string }[] = [
  { id: 'myth', label: 'Mythological World', hint: 'Places tied to myths, with how certain each identification is.' },
  { id: 'ancient', label: 'Ancient Historical', hint: 'Archaeological and historical sites, filtered by era. Ancient names.' },
  { id: 'modern', label: 'Modern', hint: 'Today’s map and modern place names.' },
];

const CLASSES: Classification[] = ['verified', 'traditionally_identified', 'debated', 'mythical'];
const LEGS = journeyGeometry(odysseus);

export default function MapView() {
  const select = useStore((s) => s.select);
  const selection = useStore((s) => s.selection);
  const reduced = useReducedMotion();
  const mounted = useMounted();
  const isMobile = useIsMobile();
  const [optionsOpen, setOptionsOpen] = useState(false);

  const [layer, setLayer] = useState<MapLayer>('myth');
  const [era, setEra] = useState<string>('all');
  const [globe, setGlobe] = useState(false);
  const [showMythic, setShowMythic] = useState(true);
  const [showJourney, setShowJourney] = useState(true);
  const [leg, setLeg] = useState<number | null>(null);
  const [progress, setProgressState] = useState(0);
  const progressRef = useRef(0);
  const setProgress = (v: number) => {
    progressRef.current = v;
    setProgressState(v);
  };
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const legListRef = useRef<HTMLOListElement>(null);

  const selectedId = selection?.kind === 'location' ? selection.id : null;

  // Animate the ship along each leg; reduced motion steps instead.
  useEffect(() => {
    if (!playing || leg === null) return;
    if (reduced) {
      setProgress(1);
      const t = setTimeout(() => {
        if (leg >= LEGS.length - 1) setPlaying(false);
        else setLeg(leg + 1);
      }, 2200);
      return () => clearTimeout(t);
    }
    let raf = 0;
    let last = performance.now();
    const dur = LEGS[leg].drawable ? 2600 : 1800;
    const tick = (now: number) => {
      const p = progressRef.current + (now - last) / dur;
      last = now;
      if (p >= 1) {
        if (leg >= LEGS.length - 1) {
          setProgress(1);
          setPlaying(false);
        } else {
          setProgress(0);
          setLeg(leg + 1);
        }
        return;
      }
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, leg, reduced]);

  useEffect(() => {
    if (leg === null) return;
    const list = legListRef.current;
    const item = list?.querySelector<HTMLElement>(`[data-leg="${leg}"]`);
    if (list && item) list.scrollTo({ top: item.offsetTop - 8, behavior: reduced ? 'auto' : 'smooth' });
  }, [leg, reduced]);

  const activeGeo = leg === null ? null : LEGS[leg];
  const mythicActive =
    activeGeo && [activeGeo.leg.to, activeGeo.leg.from].map((id) => locationsById.get(id)!).find((l) => l.classification === 'mythical')?.id;

  const start = () => {
    setShowJourney(true);
    if (layer !== 'myth') setLayer('myth');
    if (leg === null || leg >= LEGS.length - 1) {
      setLeg(0);
      setProgress(0);
    }
    setPlaying(true);
  };
  const step = (d: number) => {
    setPlaying(false);
    setLeg((l) => Math.min(LEGS.length - 1, Math.max(0, (l ?? -1) + d)));
    setProgress(1);
  };

  const webgl = mounted && hasWebGL();
  const countFor = (c: Classification) => data.locations.filter((l) => l.classification === c).length;

  return (
    <div className="flex flex-col gap-3 p-2 sm:p-3 xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="panel p-3">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl text-gold">Map</h1>
            <div role="radiogroup" aria-label="Map layer" className="scroll-x-hint ml-2 flex gap-1 overflow-x-auto whitespace-nowrap">
              {LAYERS.map((l) => (
                <button key={l.id} type="button" role="radio" aria-checked={layer === l.id} title={l.hint} className={`btn shrink-0 ${layer === l.id ? 'btn-active' : ''}`} onClick={() => setLayer(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
            {isMobile ? (
              <button type="button" className="btn ml-auto shrink-0" aria-expanded={optionsOpen} aria-controls="map-options" onClick={() => setOptionsOpen((o) => !o)}>
                {optionsOpen ? 'Hide' : 'Options'}
              </button>
            ) : null}
          </div>
          <div id="map-options" className={`mt-3 flex flex-wrap items-end gap-3 ${isMobile && !optionsOpen ? 'hidden' : ''}`}>
            <div>
              <label htmlFor="era" className="block text-xs text-mist">
                Era (historical layer only)
              </label>
              <select
                id="era"
                value={era}
                disabled={layer !== 'ancient'}
                onChange={(e) => setEra(e.target.value)}
                className="rounded-md border border-gold/30 bg-cosmos-3 px-2 py-1 text-sm disabled:opacity-50"
              >
                <option value="all">All eras</option>
                {data.periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={showMythic} onChange={(e) => setShowMythic(e.target.checked)} className="accent-[#C9A227]" />
              Mythical places (symbolic map)
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={showJourney} onChange={(e) => setShowJourney(e.target.checked)} className="accent-[#C9A227]" />
              Odysseus&apos; route
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={globe} onChange={(e) => setGlobe(e.target.checked)} className="accent-[#C9A227]" />
              Globe
            </label>
          </div>
        </div>
        <p className="hidden px-1 text-xs text-mist md:block">
          {LAYERS.find((l) => l.id === layer)!.hint} The era selector filters historical sites only; mythical places are toggled separately because myth has no era.
        </p>

        <div className="panel relative h-[52dvh] min-h-[300px] overflow-hidden md:h-[58vh] md:min-h-[360px]" data-testid="map">
          {webgl ? (
            <MapCanvas
              layer={layer}
              era={era}
              globe={globe}
              showJourney={showJourney}
              activeLeg={leg}
              progress={progress}
              selectedId={selectedId}
              reduced={reduced}
              onSelect={(id) => select({ kind: 'location', id })}
              onError={setNotice}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-mist">
              {mounted ? 'WebGL is unavailable, so the interactive map is replaced by the place list and symbolic map.' : 'Loading map…'}
            </div>
          )}
          {notice ? <p className="absolute left-2 top-2 rounded bg-cosmos/90 px-2 py-1 text-xs text-debated">{notice}</p> : null}
          {isMobile && activeGeo && showJourney ? (
            <div className="absolute inset-x-2 bottom-2 rounded-md border-l-4 bg-cosmos/90 p-2 text-xs" style={{ borderColor: tokens.color[activeGeo.leg.certainty] }} aria-live="polite">
              <span className="block font-medium text-marble">
                {activeGeo.index + 1}. {activeGeo.leg.label}
              </span>
              <span style={{ color: tokens.color[activeGeo.leg.certainty] }}>{classificationLabel[activeGeo.leg.certainty]}</span>
              {!activeGeo.drawable ? <span className="text-mythic"> · symbolic map only</span> : null}
            </div>
          ) : null}
          <ul className="absolute bottom-2 left-2 hidden space-y-0.5 rounded bg-cosmos/85 p-2 text-xs sm:block" aria-label="Legend">
            {CLASSES.map((c) => (
              <li key={c} className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c === 'mythical' ? 'transparent' : tokens.color[c], border: `2px solid ${tokens.color[c]}` }} />
                {classificationLabel[c]} ({countFor(c)})
              </li>
            ))}
            <li className="text-mist">Hollow ring = proposed identification</li>
          </ul>
        </div>

        <ul className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-[11px] text-mist sm:hidden" aria-label="Legend">
          {CLASSES.map((c) => (
            <li key={c} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: c === 'mythical' ? 'transparent' : tokens.color[c], border: `2px solid ${tokens.color[c]}` }} />
              {classificationLabel[c].replace(' — no terrestrial location', '').replace(' identification', '')}
            </li>
          ))}
          <li>○ proposed</li>
        </ul>

        {showMythic ? (
          <div className="mx-auto w-full max-w-2xl">
            <SymbolicMap activeId={mythicActive ?? null} />
          </div>
        ) : null}
      </div>

      <aside className="flex flex-col gap-3 xl:w-96 xl:shrink-0">
        <section className="panel p-3" aria-labelledby="journey-title">
          <h2 id="journey-title" className="font-display text-2xl text-gold">
            The return of Odysseus
          </h2>
          <p className="mb-2 text-xs text-mist">
            Each leg is labelled by how certain its geography is. Disputed stops show their proposed sites; some exist only on the symbolic map. Source: Homer, Odyssey.
          </p>
          <div className="mb-2 flex flex-wrap gap-1">
            {playing ? (
              <button type="button" className="btn" onClick={() => setPlaying(false)}>
                ❚❚ Pause
              </button>
            ) : (
              <button type="button" className="btn btn-active" onClick={start} data-testid="journey-play">
                ▶ {leg === null ? 'Play journey' : 'Resume'}
              </button>
            )}
            <button type="button" className="btn" onClick={() => step(-1)} disabled={!leg}>
              ← Leg
            </button>
            <button type="button" className="btn" onClick={() => step(1)} disabled={leg === LEGS.length - 1}>
              Leg →
            </button>
          </div>
          <ol ref={legListRef} className="relative max-h-[50vh] space-y-1.5 overflow-auto pr-1" aria-label="Journey legs">
            {LEGS.map((g) => {
              const active = g.index === leg;
              const to = locationsById.get(g.leg.to)!;
              return (
                <li key={g.index} data-leg={g.index}>
                  <button
                    type="button"
                    aria-current={active ? 'step' : undefined}
                    onClick={() => {
                      setPlaying(false);
                      setLeg(g.index);
                      setProgress(1);
                      select({ kind: 'location', id: to.id });
                    }}
                    className={`w-full rounded-md border-l-4 p-2 text-left text-sm ${active ? 'bg-gold/15' : 'bg-cosmos-3/50 hover:bg-cosmos-3'}`}
                    style={{ borderColor: tokens.color[g.leg.certainty] }}
                  >
                    <span className="block font-medium">
                      {g.index + 1}. {g.leg.label}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="chip" style={{ color: tokens.color[g.leg.certainty] }}>
                        {classificationLabel[g.leg.certainty]}
                      </span>
                      <span className="text-mist">{g.leg.ref}</span>
                      {!g.drawable ? <span className="text-mythic">· symbolic map only</span> : null}
                    </span>
                    {active ? <span className="mt-1 block text-xs text-marble/85">{g.leg.note}</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="panel p-3" aria-labelledby="places-title">
          <h2 id="places-title" className="font-display text-2xl text-gold">
            Places
          </h2>
          {CLASSES.map((c) => {
            const list = data.locations.filter((l) => l.classification === c && (c === 'mythical' ? showMythic : layer !== 'ancient' || activeIn(l, era)));
            if (!list.length) return null;
            return (
              <div key={c} className="mt-2">
                <h3 className="text-xs uppercase tracking-wide" style={{ color: tokens.color[c] }}>
                  {classificationLabel[c]}
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {list.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        className={`chip hover:bg-cosmos-3 ${selectedId === l.id ? 'text-gold' : 'text-marble'}`}
                        aria-pressed={selectedId === l.id}
                        onClick={() => select({ kind: 'location', id: l.id })}
                      >
                        {layer === 'modern' && l.classification !== 'mythical' ? l.modernName : l.ancientName}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </aside>
    </div>
  );
}
