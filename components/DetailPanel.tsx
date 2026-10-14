'use client';

import { useEffect, useRef, useState } from 'react';
import { isBookmarked, useStore } from '@/lib/store';
import {
  attestationKindLabel,
  attestationsById,
  attestationsFor,
  cite,
  classificationLabel,
  data,
  entitiesById,
  formatDateRange,
  historicalById,
  labelOf,
  locationsById,
  mythicEventsById,
  periodOf,
  stageOfMythicRef,
  stagesById,
  stagesOrdered,
  kindOf,
  type Selection,
} from '@/lib/data';
import { tokens } from '@/lib/tokens';
import CharacterPanel from './CharacterPanel';
import { ContentTag, evidenceToContent } from './ContentTag';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-mist">{title}</h3>
      {children}
    </section>
  );
}

function Pill({ id, color }: { id: string; color?: string }) {
  const select = useStore((s) => s.select);
  const kind = kindOf(id);
  if (!kind) return <span>{id}</span>;
  return (
    <button type="button" className="chip hover:bg-cosmos-3" style={{ color }} onClick={() => select({ kind, id })}>
      {labelOf(id)}
    </button>
  );
}

function Sources({ ids, refs }: { ids: string[]; refs?: Record<string, string> }) {
  return (
    <Section title="Sources">
      <ul className="list-disc space-y-0.5 pl-5 text-sm text-marble/85">
        {ids.map((s) => (
          <li key={s}>{cite(s, refs?.[s])}</li>
        ))}
      </ul>
    </Section>
  );
}

function Bridges({ mythicId }: { mythicId: string }) {
  const list = attestationsFor(mythicId);
  if (!list.length) return null;
  return (
    <Section title="Attestation bridges">
      <ul className="space-y-1">
        {list.map((a) => {
          const h = historicalById.get(a.historicalRef)!;
          return (
            <li key={a.id} className="text-sm">
              <Pill id={a.id} color={tokens.color.attestation} />{' '}
              <span className="text-xs text-gold">
                {h.name}, {formatDateRange(h)}
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function StageDetail({ id }: { id: string }) {
  const s = stagesById.get(id)!;
  const idx = stagesOrdered.findIndex((x) => x.id === id);
  const events = data.mythicEvents.filter((m) => m.stage === id);
  const figures = data.entities.filter((e) => e.mythicStage === id);
  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-mythic">Mythic stage {idx + 1} of {stagesOrdered.length}</p>
        <h2 className="font-display text-3xl text-gold">{s.name}</h2>
        <p className="font-display text-lg italic text-marble/85">{s.tagline}</p>
      </header>
      <ContentTag kind="myth" />
      <p className="leading-relaxed">{s.description}</p>
      <p className="rounded border border-mythic/40 bg-mythic/10 p-2 text-xs text-mythic">
        Mythic stages are ordered, not dated. &ldquo;Before&rdquo; and &ldquo;after&rdquo; here follow the sequence of the sources, not a calendar.
      </p>
      {events.length ? (
        <Section title="Events in this stage">
          <div className="flex flex-wrap gap-1.5">{events.map((m) => <Pill key={m.id} id={m.id} color={tokens.color.mythic} />)}</div>
        </Section>
      ) : null}
      {figures.length ? (
        <Section title="Figures who emerge here">
          <div className="flex flex-wrap gap-1.5">{figures.map((e) => <Pill key={e.id} id={e.id} />)}</div>
        </Section>
      ) : null}
      <Bridges mythicId={id} />
      <Sources ids={s.sources} />
    </div>
  );
}

export function MythicEventDetail({ id }: { id: string }) {
  const m = mythicEventsById.get(id)!;
  const stage = stagesById.get(m.stage)!;
  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-mythic">Mythic event · {stage.name}</p>
        <h2 className="font-display text-3xl text-gold">{m.name}</h2>
      </header>
      <ContentTag kind="myth" />
      <p className="leading-relaxed">{m.summary}</p>
      <p className="rounded border border-mythic/40 bg-mythic/10 p-2 text-xs text-mythic">
        This event has no date. It sits in a sequence: what the sources place before and after it.
      </p>
      {m.after?.length ? (
        <Section title="Comes after">
          <div className="flex flex-wrap gap-1.5">{m.after.map((x) => <Pill key={x} id={x} color={tokens.color.mythic} />)}</div>
        </Section>
      ) : null}
      {m.before?.length ? (
        <Section title="Comes before">
          <div className="flex flex-wrap gap-1.5">{m.before.map((x) => <Pill key={x} id={x} color={tokens.color.mythic} />)}</div>
        </Section>
      ) : null}
      <Section title="Participants">
        <div className="flex flex-wrap gap-1.5">{m.participants.map((p) => <Pill key={p} id={p} />)}</div>
      </Section>
      <Bridges mythicId={id} />
      <Sources ids={m.sources} refs={m.sourceRefs} />
    </div>
  );
}

export function HistoricalDetail({ id }: { id: string }) {
  const h = historicalById.get(id)!;
  const bridges = data.attestations.filter((a) => a.historicalRef === id);
  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-gold">Historical evidence · {periodOf(h)?.name}</p>
        <h2 className="font-display text-3xl text-gold">{h.name}</h2>
        <p className="mt-1 text-lg text-marble">{formatDateRange(h)}</p>
      </header>
      <div className="flex flex-wrap gap-1.5">
        <ContentTag kind={evidenceToContent(h.evidenceType)} />
        <span className="chip" style={{ color: h.confidence === 'high' ? tokens.color.verified : h.confidence === 'medium' ? tokens.color.gold : tokens.color.debated }}>
          {h.confidence} confidence
        </span>
      </div>
      <p className="leading-relaxed">{h.summary}</p>
      {h.uncertainty ? (
        <p className="rounded border border-debated/50 bg-debated/10 p-2 text-sm text-debated">
          <strong>Uncertainty:</strong> {h.uncertainty}
        </p>
      ) : null}
      {bridges.length ? (
        <Section title="Mythic traditions recorded here">
          <ul className="space-y-1 text-sm">
            {bridges.map((a) => (
              <li key={a.id}>
                <Pill id={a.id} color={tokens.color.attestation} /> <span className="text-xs text-mist">→ {labelOf(a.mythicRef)}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Sources ids={h.sources} refs={h.sourceRefs} />
    </div>
  );
}

export function AttestationDetail({ id }: { id: string }) {
  const a = attestationsById.get(id)!;
  const h = historicalById.get(a.historicalRef)!;
  const stage = stageOfMythicRef(a.mythicRef);
  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-marble/80">Attestation bridge · {attestationKindLabel[a.kind]}</p>
        <h2 className="font-display text-3xl text-gold">{a.label}</h2>
      </header>
      <div className="rounded-lg border border-dashed border-marble/50 p-3 text-sm leading-relaxed">
        <p className="mb-2 font-semibold text-marble">What this link means</p>
        <p>
          The tradition of <strong className="text-mythic">{labelOf(a.mythicRef)}</strong> is{' '}
          {a.kind === 'first_attestation'
            ? 'first recorded'
            : a.kind === 'cult_evidence'
              ? 'evidenced in worship'
              : a.kind === 'literary_codification'
                ? 'written down in a surviving text'
                : a.kind === 'archaeological_context'
                  ? 'associated with a real archaeological site'
                : a.kind === 'syncretism'
                  ? 'linked to another culture’s god'
                  : 'taken up and reinterpreted'}{' '}
          in <strong className="text-gold">{h.name}</strong> ({formatDateRange(h)}).
        </p>
        <p className="mt-2 text-mist">
          It does <em>not</em> say the story happened then or there. Myth has its own order ({stage?.name ?? 'mythic sequence'}); history has dates. This bridge only connects the
          two at the moment of recording.
        </p>
      </div>
      <p className="leading-relaxed">{a.note}</p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded border border-mythic/40 p-2">
          <p className="text-xs uppercase text-mythic">Mythic side</p>
          <Pill id={a.mythicRef} color={tokens.color.mythic} />
          <p className="mt-1 text-xs text-mist">{stage?.name} · undated</p>
        </div>
        <div className="rounded border border-gold/40 p-2">
          <p className="text-xs uppercase text-gold">Historical side</p>
          <Pill id={a.historicalRef} color={tokens.color.gold} />
          <p className="mt-1 text-xs text-mist">
            {formatDateRange(h)} · {h.evidenceType}
          </p>
        </div>
      </div>
      <Sources ids={a.sources} />
    </div>
  );
}

export function LocationDetail({ id }: { id: string }) {
  const l = locationsById.get(id)!;
  const color = tokens.color[l.classification];
  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-widest" style={{ color }}>
          {classificationLabel[l.classification]}
        </p>
        <h2 className="font-display text-3xl text-gold">{l.ancientName}</h2>
        {l.greek ? (
          <p lang="grc" className="font-display text-lg">
            {l.greek}
          </p>
        ) : null}
      </header>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded border border-gold/30 p-2">
          <p className="text-xs uppercase text-gold">Ancient</p>
          <p>{l.ancientNote}</p>
        </div>
        <div className="rounded border border-marble/30 p-2">
          <p className="text-xs uppercase text-marble">Modern</p>
          <p className="font-medium">
            {l.modernName}
            {l.country ? `, ${l.country}` : ''}
          </p>
          <p>{l.modernNote}</p>
        </div>
      </div>
      {l.coords ? (
        <p className="text-xs text-mist">
          Coordinates: {l.coords.lat.toFixed(3)}, {l.coords.lng.toFixed(3)}
        </p>
      ) : (
        <p className="rounded border border-mythic/40 bg-mythic/10 p-2 text-xs text-mythic">
          No terrestrial coordinates. This place belongs to the mythic cosmos and appears only on the symbolic map.
        </p>
      )}
      {l.confidenceNote ? (
        <p className="rounded border border-debated/40 bg-debated/10 p-2 text-sm text-debated">
          <strong>Confidence:</strong> {l.confidenceNote}
        </p>
      ) : null}
      {l.alternatives?.length ? (
        <Section title="Proposed identifications">
          <ContentTag kind="scholarship" />
          <ul className="list-disc pl-5 text-sm">
            {l.alternatives.map((a) => (
              <li key={a.label}>
                {a.label} <span className="text-xs text-mist">— {cite(a.source)}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {l.linkedEntities.length ? (
        <Section title="Figures">
          <div className="flex flex-wrap gap-1.5">{l.linkedEntities.map((e) => <Pill key={e} id={e} />)}</div>
        </Section>
      ) : null}
      {l.linkedEvents.length ? (
        <Section title="Events">
          <div className="flex flex-wrap gap-1.5">
            {l.linkedEvents.map((e) => (
              <Pill key={e} id={e} color={mythicEventsById.has(e) ? tokens.color.mythic : tokens.color.gold} />
            ))}
          </div>
        </Section>
      ) : null}
      <Sources ids={l.sources} />
    </div>
  );
}

export function SelectionDetail({ sel }: { sel: Selection }) {
  switch (sel.kind) {
    case 'entity':
      return entitiesById.has(sel.id) ? <CharacterPanel id={sel.id} /> : null;
    case 'stage':
      return <StageDetail id={sel.id} />;
    case 'mythicEvent':
      return <MythicEventDetail id={sel.id} />;
    case 'historicalEvent':
      return <HistoricalDetail id={sel.id} />;
    case 'attestation':
      return <AttestationDetail id={sel.id} />;
    case 'location':
      return <LocationDetail id={sel.id} />;
  }
}

/** Mobile: a bottom sheet with a drag handle (peek / full / dismiss). Desktop: a sticky side panel. */
export default function DetailPanel({ mobile = false }: { mobile?: boolean }) {
  const sel = useStore((s) => s.selection);
  const select = useStore((s) => s.select);
  const bookmarks = useStore((s) => s.bookmarks);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const back = useStore((s) => s.back);
  const canGoBack = useStore((s) => s.history.length > 1);
  const ref = useRef<HTMLElement>(null);
  const [full, setFull] = useState(false);
  const [drag, setDrag] = useState<{ startY: number; dy: number } | null>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
    setFull(false);
  }, [sel]);

  if (!sel || !kindOf(sel.id)) return null;
  const marked = isBookmarked(bookmarks, sel);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ startY: e.clientY, dy: 0 });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag) setDrag({ ...drag, dy: e.clientY - drag.startY });
  };
  const onPointerUp = () => {
    if (!drag) return;
    const { dy } = drag;
    setDrag(null);
    if (dy > 70) {
      if (full) setFull(false);
      else select(null);
    } else if (dy < -50) setFull(true);
    else if (Math.abs(dy) < 6) setFull((f) => !f); // a tap on the handle toggles
  };

  const actions = (
    <div className="mb-2 flex justify-end gap-2">
      {canGoBack ? (
        <button type="button" className="btn mr-auto" onClick={back} aria-label="Back to previous item">
          ← Back
        </button>
      ) : null}
      <button type="button" className="btn" aria-pressed={marked} onClick={() => toggleBookmark(sel)}>
        {marked ? '★ Bookmarked' : '☆ Bookmark'}
      </button>
      <button type="button" className="btn" onClick={() => select(null)} aria-label="Close details">
        ✕
      </button>
    </div>
  );

  if (mobile) {
    return (
      <aside
        ref={ref}
        aria-label="Details"
        data-testid="detail-panel"
        className="panel safe-bottom fixed inset-x-0 bottom-14 z-20 flex flex-col rounded-b-none shadow-2xl"
        style={{
          height: full ? 'calc(88dvh - 3.5rem)' : 'calc(46dvh - 3.5rem)',
          transform: drag ? `translateY(${Math.max(0, drag.dy)}px)` : undefined,
          transition: drag ? 'none' : 'height 0.25s ease, transform 0.2s ease',
        }}
      >
        <div
          className="shrink-0 cursor-grab touch-none px-4 pt-1"
          role="button"
          tabIndex={0}
          aria-label={full ? 'Collapse details' : 'Expand details'}
          aria-expanded={full}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDrag(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFull((f) => !f);
            }
          }}
        >
          <div className="sheet-handle" />
          {actions}
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          <SelectionDetail sel={sel} />
        </div>
      </aside>
    );
  }

  return (
    <aside
      ref={ref}
      aria-label="Details"
      data-testid="detail-panel"
      className="panel sticky top-[7.5rem] z-20 m-2 max-h-[calc(100dvh-8.5rem)] w-[24rem] shrink-0 overflow-auto p-4 shadow-2xl"
    >
      {actions}
      <SelectionDetail sel={sel} />
    </aside>
  );
}
