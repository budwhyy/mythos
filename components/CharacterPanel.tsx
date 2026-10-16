'use client';

import { useStore } from '@/lib/store';
import {
  attestationsFor,
  cite,
  data,
  entitiesById,
  eventsForEntity,
  formatDateRange,
  historicalById,
  locationsForEntity,
  stagesById,
  stagesOrdered,
  attestationKindLabel,
} from '@/lib/data';
import { edgeColor } from '@/lib/tokens';
import type { RelationshipKind } from '@/lib/schema';
import { ContentTag } from './ContentTag';
import Portrait from './Portrait';

const LEVELS = ['beginner', 'intermediate', 'scholarly'] as const;

const relLabel = (kind: RelationshipKind, outgoing: boolean) =>
  ({
    parent: outgoing ? 'Parent of' : 'Child of',
    partner: 'Partner of',
    sibling: 'Sibling of',
    conflict: 'In conflict with',
    alliance: 'Allied with',
  })[kind];

export default function CharacterPanel({ id, headingLevel = 2 }: { id: string; headingLevel?: 2 | 3 }) {
  const e = entitiesById.get(id);
  const level = useStore((s) => s.readingLevel);
  const setLevel = useStore((s) => s.setReadingLevel);
  const select = useStore((s) => s.select);
  if (!e) return <p>Unknown figure.</p>;

  const stage = stagesById.get(e.mythicStage)!;
  const stageIndex = stagesOrdered.findIndex((s) => s.id === stage.id);
  const rels = data.relationships.filter((r) => r.from === id || r.to === id);
  const parentsBySource = new Map<string, string[]>();
  for (const r of rels) if (r.kind === 'parent' && r.to === id) parentsBySource.set(r.source, [...(parentsBySource.get(r.source) ?? []), r.from]);
  const genealogyConflict = new Set([...parentsBySource.values()].map((p) => [...p].sort().join('+'))).size > 1;

  const grouped = new Map<string, typeof rels>();
  for (const r of rels) {
    const key = relLabel(r.kind, r.from === id);
    grouped.set(key, [...(grouped.get(key) ?? []), r]);
  }
  const attests = attestationsFor(id);
  const events = eventsForEntity(id);
  const places = locationsForEntity(id);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const H2 = headingLevel === 2 ? 'h3' : 'h4';

  return (
    <article className="space-y-4" aria-labelledby={`char-${id}`}>
      <header>
        <H id={`char-${id}`} className="font-display text-3xl text-gold">
          {e.name}
        </H>
        {e.greek ? (
          <p lang="grc" className="font-display text-xl text-marble/90">
            {e.greek}
          </p>
        ) : null}
        <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
          <span className="chip capitalize text-mythic">{e.type}</span>
          {e.titles?.map((t) => (
            <span key={t} className="chip text-marble/80">
              {t}
            </span>
          ))}
        </p>
        {e.domains?.length ? (
          <p className="mt-2 text-sm text-marble/80">
            <span className="text-mist">Domain: </span>
            {e.domains.join(', ')}
          </p>
        ) : null}
      </header>

      <Portrait entity={e} />

      <section aria-label="Summary">
        <div role="tablist" aria-label="Reading level" className="mb-2 flex gap-1">
          {LEVELS.map((l) => (
            <button
              key={l}
              role="tab"
              type="button"
              aria-selected={level === l}
              className={`btn capitalize ${level === l ? 'btn-active' : ''}`}
              onClick={() => setLevel(l)}
            >
              {l}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="space-y-1">
          <ContentTag kind={level === 'scholarly' ? 'scholarship' : 'myth'} />
          <p className="leading-relaxed text-marble/95">{e.summary[level]}</p>
        </div>
      </section>

      <section>
        <H2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Mythic position</H2>
        <button type="button" className="text-left text-mythic underline-offset-2 hover:underline" onClick={() => select({ kind: 'stage', id: stage.id })}>
          {stage.name}
        </button>
        <span className="text-sm text-mist"> — stage {stageIndex + 1} of {stagesOrdered.length} in the mythic sequence (ordinal, undated)</span>
      </section>

      <section>
        <H2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Attestation · when the tradition is first recorded</H2>
        {attests.length ? (
          <ul className="space-y-2">
            {attests.map((a) => {
              const h = historicalById.get(a.historicalRef)!;
              return (
                <li key={a.id} className="rounded-md border border-dashed border-marble/30 p-2 text-sm">
                  <button type="button" className="text-left font-medium text-marble hover:underline" onClick={() => select({ kind: 'attestation', id: a.id })}>
                    {a.label}
                  </button>
                  <div className="text-xs text-gold">
                    {attestationKindLabel[a.kind]} · {h.name}, {formatDateRange(h)} · {h.evidenceType}, {h.confidence} confidence
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-mist">No direct attestation recorded in this prototype. Recorded sources are listed below.</p>
        )}
      </section>

      <section>
        <H2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Relationships</H2>
        {genealogyConflict ? (
          <p className="mb-2 rounded border border-debated/50 bg-debated/10 p-2 text-xs text-debated">
            Ancient sources disagree about this figure&apos;s parentage. Each account is shown separately with its source.
          </p>
        ) : null}
        <dl className="space-y-2 text-sm">
          {[...grouped.entries()].map(([label, rs]) => (
            <div key={label}>
              <dt className="text-xs text-mist">{label}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {rs.map((r) => {
                  const other = r.from === id ? r.to : r.from;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className="chip hover:bg-cosmos-3"
                      style={{ color: edgeColor(r.kind) }}
                      onClick={() => select({ kind: 'entity', id: other })}
                      title={cite(r.source, r.ref)}
                    >
                      {entitiesById.get(other)?.name}
                      <span className="text-[10px] text-mist">({cite(r.source, r.ref)})</span>
                    </button>
                  );
                })}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {events.length ? (
        <section>
          <H2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Appears in</H2>
          <ul className="flex flex-wrap gap-1.5">
            {events.map((m) => (
              <li key={m.id}>
                <button type="button" className="chip text-mythic hover:bg-cosmos-3" onClick={() => select({ kind: 'mythicEvent', id: m.id })}>
                  {m.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {places.length ? (
        <section>
          <H2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Places</H2>
          <ul className="flex flex-wrap gap-1.5">
            {places.map((l) => (
              <li key={l.id}>
                <button type="button" className="chip text-marble hover:bg-cosmos-3" onClick={() => select({ kind: 'location', id: l.id })}>
                  {l.ancientName}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <H2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Sources</H2>
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-marble/85">
          {e.sources.map((s) => (
            <li key={s}>{cite(s, e.sourceRefs?.[s])}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
