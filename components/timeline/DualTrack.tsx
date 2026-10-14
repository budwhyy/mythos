'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { layoutTrack } from '@/lib/timeline';
import { formatDateRange, formatYear, labelOf, stageOfMythicRef, stagesOrdered } from '@/lib/data';
import { tokens } from '@/lib/tokens';

const confColor = { high: tokens.color.verified, medium: tokens.color.gold, low: tokens.color.debated } as const;

export default function DualTrack() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [baseW, setBaseW] = useState(1200);
  const [zoom, setZoom] = useState(1);
  const selection = useStore((s) => s.selection);
  const stageFocus = useStore((s) => s.stageFocus);
  const select = useStore((s) => s.select);
  const setStageFocus = useStore((s) => s.setStageFocus);
  const [hoverBridge, setHoverBridge] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBaseW(Math.max(1100, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const L = useMemo(() => layoutTrack(Math.round(baseW * zoom)), [baseW, zoom]);

  const selId = selection?.id;
  const activeBridge = (aId: string, mythicRef: string, histRef: string) =>
    hoverBridge === aId ||
    selId === aId ||
    selId === mythicRef ||
    selId === histRef ||
    (!selId && stageFocus !== null && stageOfMythicRef(mythicRef)?.id === stageFocus);

  return (
    <section aria-labelledby="dual-track-title" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4">
        <h2 id="dual-track-title" className="font-display text-2xl text-gold">
          Two clocks, one bridge
        </h2>
        <div className="flex items-center gap-2 text-xs" role="group" aria-label="Zoom historical axis">
          <span className="text-mist">Zoom</span>
          {[1, 2, 3].map((z) => (
            <button key={z} type="button" className="btn" aria-pressed={zoom === z} onClick={() => setZoom(z)}>
              {z}×
            </button>
          ))}
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 px-4 text-xs text-marble/80" aria-label="Legend">
        <li>
          <span className="text-mythic">●</span> Mythic sequence — ordered, <strong>never dated</strong>
        </li>
        <li>
          <span className="text-gold">▬</span> Historical evidence — dated, with confidence
        </li>
        <li>
          <span className="text-marble">┄</span> Attestation bridge — where a tradition is first recorded
        </li>
      </ul>
      <p className="px-4 text-xs text-mist md:hidden">Swipe sideways to move along both tracks.</p>
      <div ref={wrapRef} className="scroll-x-hint overflow-x-auto px-2" tabIndex={0} aria-label="Dual timeline (scrolls horizontally)">
        <svg width={L.width} height={L.height} role="img" aria-labelledby="dual-track-title dual-track-desc" className="block">
          <desc id="dual-track-desc">
            Top: the eight mythic stages in order, without dates. Bottom: dated historical periods and events. Dashed lines connect mythic traditions to the historical evidence in
            which they are first recorded.
          </desc>
          <defs>
            <linearGradient id="rail" x1="0" x2="1">
              <stop offset="0" stopColor={tokens.color.mythic} stopOpacity="0.15" />
              <stop offset="0.5" stopColor={tokens.color.mythic} stopOpacity="0.6" />
              <stop offset="1" stopColor={tokens.color.mythic} stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* MYTHIC FRAME — ordinal rail, no ticks, no ruler */}
          <text x={8} y={20} fill={tokens.color.mythic} fontSize={11} letterSpacing={2}>
            MYTHIC SEQUENCE · ORDINAL, UNDATED
          </text>
          <path
            d={`M ${L.stageX.get(stagesOrdered[0].id)} ${L.railY} ${stagesOrdered
              .slice(1)
              .map((s, i) => `Q ${(L.stageX.get(stagesOrdered[i].id)! + L.stageX.get(s.id)!) / 2} ${L.railY - 16 * (i % 2 ? -1 : 1)} ${L.stageX.get(s.id)} ${L.railY}`)
              .join(' ')}`}
            stroke="url(#rail)"
            strokeWidth={2}
            fill="none"
          />
          {stagesOrdered.map((s) => {
            const x = L.stageX.get(s.id)!;
            const active = stageFocus === s.id || selId === s.id;
            return (
              <g
                key={s.id}
                role="button"
                tabIndex={0}
                aria-label={`Mythic stage: ${s.name}`}
                aria-pressed={active}
                className="cursor-pointer outline-none"
                onClick={() => {
                  setStageFocus(s.id);
                  select({ kind: 'stage', id: s.id });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setStageFocus(s.id);
                    select({ kind: 'stage', id: s.id });
                  }
                }}
              >
                <circle cx={x} cy={L.railY} r={active ? 11 : 8} fill={tokens.color.cosmos} stroke={tokens.color.mythic} strokeWidth={active ? 3 : 1.5} />
                <circle cx={x} cy={L.railY} r={3} fill={active ? tokens.color.gold : tokens.color.mythic} />
                <text x={x} y={L.railY - 18} textAnchor="middle" fill={active ? tokens.color.gold : tokens.color.marble} fontSize={12} fontFamily="var(--font-display)">
                  {s.name}
                </text>
              </g>
            );
          })}
          {[...L.mythicAnchor.entries()].map(([id, p]) => {
            const stage = stageOfMythicRef(id);
            if (stage?.id === id) return null;
            return (
              <g key={id}>
                <circle cx={p.x} cy={p.y} r={3.5} fill={tokens.color.mythic} opacity={0.85}>
                  <title>{labelOf(id)}</title>
                </circle>
              </g>
            );
          })}

          {/* HISTORICAL FRAME — dated axis */}
          {L.periods.map(({ p, x1, x2, row }) => (
            <g key={p.id}>
              <title>{`${p.name}: ${formatYear(p.startYear)} – ${formatYear(p.endYear)} (conventional boundaries)`}</title>
              <rect x={x1} y={L.periodTop + row * 22} width={x2 - x1} height={18} rx={4} fill={tokens.color.bronze} opacity={0.28} stroke={tokens.color.bronze} />
              <text x={x1 + 6} y={L.periodTop + row * 22 + 13} fontSize={11} fill={tokens.color.marble}>
                {p.name}
              </text>
            </g>
          ))}
          <line x1={L.yearToX(-2000)} x2={L.yearToX(600)} y1={L.axisY} y2={L.axisY} stroke={tokens.color.gold} strokeOpacity={0.6} />
          {L.ticks.map((t) => (
            <g key={t.year}>
              <line x1={t.x} x2={t.x} y1={L.axisY} y2={L.axisY + 6} stroke={tokens.color.gold} strokeOpacity={0.6} />
              <text x={t.x} y={L.axisY + 18} fontSize={10} textAnchor="middle" fill={tokens.color.mist}>
                {t.year === 0 ? '1 BCE | 1 CE' : formatYear(t.year)}
              </text>
            </g>
          ))}
          <text x={8} y={L.axisY + 30} fill={tokens.color.gold} fontSize={11} letterSpacing={2}>
            HISTORICAL AXIS · DATED
          </text>

          {/* BRIDGES — drawn beneath event markers so markers stay clickable */}
          {L.bridges.map(({ a, from, to }) => {
            const active = activeBridge(a.id, a.mythicRef, a.historicalRef);
            const d = `M ${from.x} ${from.y + 4} C ${from.x} ${(from.y + to.y) / 2}, ${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y - 4}`;
            const h = L.events.find((e) => e.h.id === a.historicalRef)!.h;
            return (
              <g
                key={a.id}
                role="button"
                tabIndex={0}
                aria-label={`Attestation bridge: ${a.label}. Links ${labelOf(a.mythicRef)} to ${h.name}, ${formatDateRange(h)}`}
                className="cursor-pointer outline-none"
                data-testid="attestation-bridge"
                onClick={() => select({ kind: 'attestation', id: a.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select({ kind: 'attestation', id: a.id });
                  }
                }}
                onMouseEnter={() => setHoverBridge(a.id)}
                onMouseLeave={() => setHoverBridge(null)}
                onFocus={() => setHoverBridge(a.id)}
                onBlur={() => setHoverBridge(null)}
              >
                <path d={d} stroke="transparent" strokeWidth={12} fill="none" />
                <path
                  d={d}
                  stroke={tokens.color.attestation}
                  strokeOpacity={active ? 0.95 : 0.3}
                  strokeWidth={active ? 2 : 1.2}
                  strokeDasharray="5 5"
                  fill="none"
                />
              </g>
            );
          })}

          {L.events.map(({ h, x1, x2, y, labelW }) => {
            const active = selId === h.id;
            return (
              <g
                key={h.id}
                role="button"
                tabIndex={0}
                aria-label={`${h.name}, ${formatDateRange(h)}, ${h.confidence} confidence, ${h.evidenceType} evidence`}
                className="cursor-pointer outline-none"
                onClick={() => select({ kind: 'historicalEvent', id: h.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select({ kind: 'historicalEvent', id: h.id });
                  }
                }}
              >
                <rect x={x1 - 2} y={y - 12} width={Math.max(x2 - x1, labelW) + 4} height={16} fill="transparent" />
                <rect x={x1} y={y - 3} width={x2 - x1} height={6} rx={3} fill={confColor[h.confidence]} opacity={active ? 1 : 0.8} />
                <circle cx={x1} cy={y} r={active ? 5 : 3.5} fill={confColor[h.confidence]} stroke={active ? tokens.color.marble : 'none'} />
                <text x={x1 + 6} y={y - 6} fontSize={10.5} fill={active ? tokens.color.gold : tokens.color.marble}>
                  {h.name.length > 36 ? h.name.slice(0, 34) + '…' : h.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="px-4 text-xs text-mist">
        The two tracks share the page, not a scale. A mythic stage&apos;s left-to-right position shows only its order; crossing bridges show how a later myth (Zeus) can be
        recorded earlier than an older-seeming one (Chaos).
      </p>
    </section>
  );
}
