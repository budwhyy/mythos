'use client';

import { useStore } from '@/lib/store';
import {
  attestationsById,
  data,
  firstAttestation,
  formatDateRange,
  historicalById,
  labelOf,
  locationsById,
  periodOf,
  stageOfMythicRef,

  classificationLabel,
  sourcesById,
} from '@/lib/data';
import type { Selection } from '@/lib/data';

export function describeWhere(sel: Selection | null, stageFocus: string | null): { mythic: string; historical: string; subject?: string } {
  const mythicId = sel && (sel.kind === 'entity' || sel.kind === 'stage' || sel.kind === 'mythicEvent') ? sel.id : !sel ? stageFocus : null;

  if (mythicId) {
    const stage = stageOfMythicRef(mythicId);
    const first = firstAttestation(mythicId);
    let historical = 'First attested: no attestation recorded yet';
    if (first) {
      const h = historicalById.get(first.attestation.historicalRef)!;
      const src = sourcesById.get(h.sources[0]);
      historical = `First attested: ${periodOf(h)?.name ?? ''}, ${formatDateRange(h)} (${h.name}${src && src.kind === 'ancient' ? ', ' + src.author : ''})${
        first.via !== mythicId ? ` — via ${labelOf(first.via)}` : ''
      }`;
    }
    return { mythic: `Mythic: ${stage?.name ?? '—'}`, historical, subject: sel ? labelOf(sel) : undefined };
  }

  if (sel?.kind === 'historicalEvent') {
    const h = historicalById.get(sel.id)!;
    const n = data.attestations.filter((a) => a.historicalRef === h.id).length;
    return {
      mythic: n ? `Mythic: bridges to ${n} tradition${n > 1 ? 's' : ''}` : 'Mythic: no mythic bridge',
      historical: `Historical: ${periodOf(h)?.name}, ${formatDateRange(h)} · ${h.confidence} confidence`,
      subject: h.name,
    };
  }

  if (sel?.kind === 'attestation') {
    const a = attestationsById.get(sel.id)!;
    const h = historicalById.get(a.historicalRef)!;
    return {
      mythic: `Mythic: ${labelOf(a.mythicRef)} (${stageOfMythicRef(a.mythicRef)?.name ?? ''})`,
      historical: `Recorded: ${periodOf(h)?.name}, ${formatDateRange(h)}`,
      subject: 'Attestation bridge',
    };
  }

  if (sel?.kind === 'location') {
    const l = locationsById.get(sel.id)!;
    const stages = new Set(
      l.linkedEvents.map((e) => stageOfMythicRef(e)?.name).filter(Boolean) as string[],
    );
    return {
      mythic: stages.size ? `Mythic: ${[...stages].join(', ')}` : 'Mythic: —',
      historical: `Place: ${classificationLabel[l.classification]}`,
      subject: l.ancientName,
    };
  }

  return { mythic: 'Mythic: choose a stage, figure or event', historical: 'History: dates appear only on the historical track' };
}

export default function WhereAmI() {
  const selection = useStore((s) => s.selection);
  const stageFocus = useStore((s) => s.stageFocus);
  const w = describeWhere(selection, stageFocus);
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gold/10 bg-cosmos-2/80 px-4 py-1.5 text-xs sm:text-sm"
      aria-live="polite"
      data-testid="where-am-i"
    >
      <span className="font-semibold uppercase tracking-wider text-mist">Where am I?</span>
      {w.subject ? <span className="font-display text-base text-marble">{w.subject}</span> : null}
      <span className="text-mythic">{w.mythic}</span>
      <span aria-hidden="true" className="text-mist">
        ·
      </span>
      <span className="text-gold">{w.historical}</span>
    </div>
  );
}

