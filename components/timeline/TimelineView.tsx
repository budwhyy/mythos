'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { use2D, useReducedMotion } from '@/lib/hooks';
import { attestationsById, data, formatDateRange, historicalById, labelOf, stageOfMythicRef, stagesOrdered, attestationKindLabel } from '@/lib/data';
import MythicSequence2D from './MythicSequence2D';
import DualTrack from './DualTrack';

const MythicSequence3D = dynamic(() => import('./MythicSequence3D'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-mist">Gathering the stars…</div>,
});

export default function TimelineView() {
  const selection = useStore((s) => s.selection);
  const stageFocus = useStore((s) => s.stageFocus);
  const setStageFocus = useStore((s) => s.setStageFocus);
  const select = useStore((s) => s.select);
  const { use2D: twoD, reason, mounted } = use2D();
  const reduced = useReducedMotion();

  // Keep the cinematic camera on the stage of whatever is selected.
  useEffect(() => {
    if (!selection) return;
    const mythicId =
      selection.kind === 'attestation' ? attestationsById.get(selection.id)?.mythicRef : ['entity', 'stage', 'mythicEvent'].includes(selection.kind) ? selection.id : null;
    const stage = mythicId ? stageOfMythicRef(mythicId) : undefined;
    if (stage) setStageFocus(stage.id);
  }, [selection, setStageFocus]);

  useEffect(() => {
    if (!stageFocus) setStageFocus(stagesOrdered[0].id);
  }, [stageFocus, setStageFocus]);

  const idx = Math.max(0, stagesOrdered.findIndex((s) => s.id === stageFocus));
  const go = (d: number) => {
    const next = stagesOrdered[Math.min(stagesOrdered.length - 1, Math.max(0, idx + d))];
    setStageFocus(next.id);
    select({ kind: 'stage', id: next.id });
  };

  return (
    <div className="space-y-6 pb-10">
      <section
        aria-labelledby="mythic-title"
        className="relative"
        onKeyDown={(e) => {
          if ((e.target as HTMLElement).tagName === 'INPUT') return;
          if (e.key === 'ArrowRight') go(1);
          if (e.key === 'ArrowLeft') go(-1);
        }}
      >
        <h1 id="mythic-title" className="sr-only">
          Mythic sequence and historical timeline
        </h1>
        <div className="relative h-[50dvh] min-h-[280px] w-full overflow-hidden border-b border-gold/15 md:h-[42vh]" data-testid="mythic-sequence">
          {mounted && !twoD ? <MythicSequence3D reduced={reduced} /> : <MythicSequence2D />}
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 py-2">
          <button type="button" className="btn" onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous mythic stage">
            ← Before
          </button>
          <ol className="flex flex-wrap gap-1" aria-label="Mythic stages">
            {stagesOrdered.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`rounded-full px-2.5 py-1 text-xs ${i === idx ? 'bg-mythic/30 text-marble ring-1 ring-mythic' : 'text-marble/75 hover:bg-cosmos-3'}`}
                  aria-current={i === idx ? 'step' : undefined}
                  onClick={() => {
                    setStageFocus(s.id);
                    select({ kind: 'stage', id: s.id });
                  }}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="btn" onClick={() => go(1)} disabled={idx === stagesOrdered.length - 1} aria-label="Next mythic stage">
            After →
          </button>
          {reason ? <p className="w-full text-xs text-mist">{reason}</p> : null}
        </div>
      </section>

      <DualTrack />

      <details className="mx-4 rounded-lg border border-gold/20 p-3">
        <summary className="cursor-pointer font-display text-xl text-gold">All attestation bridges ({data.attestations.length}) — text view</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Attestation bridges between mythic traditions and dated evidence</caption>
            <thead className="text-xs uppercase text-mist">
              <tr>
                <th scope="col" className="py-1 pr-3">Mythic tradition (undated)</th>
                <th scope="col" className="py-1 pr-3">Bridge</th>
                <th scope="col" className="py-1 pr-3">Historical evidence (dated)</th>
              </tr>
            </thead>
            <tbody>
              {data.attestations.map((a) => {
                const h = historicalById.get(a.historicalRef)!;
                return (
                  <tr key={a.id} className="border-t border-gold/10 align-top">
                    <td className="py-1.5 pr-3 text-mythic">
                      {labelOf(a.mythicRef)} <span className="text-xs text-mist">· {stageOfMythicRef(a.mythicRef)?.name}</span>
                    </td>
                    <td className="py-1.5 pr-3">
                      <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => select({ kind: 'attestation', id: a.id })}>
                        {a.label}
                      </button>
                      <div className="text-xs text-mist">{attestationKindLabel[a.kind]}</div>
                    </td>
                    <td className="py-1.5 pr-3 text-gold">
                      {h.name}
                      <div className="text-xs text-mist">
                        {formatDateRange(h)} · {h.evidenceType} · {h.confidence}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
