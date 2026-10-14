import { raw } from './raw';
import {
  validateDataset,
  type Attestation,
  type Dataset,
  type Entity,
  type HistoricalEvent,
  type Location,
  type MythicEvent,
  type MythicStage,
  type Source,
} from './schema';

// The build runs scripts/validate-data.ts first, so production pages skip re-validating in the browser.
// Dev and tests validate on load. All defaulted fields are written out explicitly in /data.
const result = process.env.NODE_ENV === 'production' ? { ok: true as const, data: raw as unknown as Dataset } : validateDataset(raw);
if (!result.ok) {
  throw new Error('MYTHOS data invalid:\n' + result.errors.join('\n'));
}

export const data: Dataset = result.data;

const index = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));

export const sourcesById = index<Source>(data.sources);
export const entitiesById = index<Entity>(data.entities);
export const stagesById = index<MythicStage>(data.stages);
export const mythicEventsById = index<MythicEvent>(data.mythicEvents);
export const historicalById = index<HistoricalEvent>(data.historicalEvents);
export const attestationsById = index<Attestation>(data.attestations);
export const locationsById = index<Location>(data.locations);
export const periodsById = index(data.periods);

export const stagesOrdered = [...data.stages].sort((a, b) => a.order - b.order);

export type SelectionKind = 'entity' | 'stage' | 'mythicEvent' | 'historicalEvent' | 'attestation' | 'location';
export type Selection = { kind: SelectionKind; id: string };

/** Signed years: BCE negative, CE positive. Used ONLY for historical records. */
export function signedRange(h: HistoricalEvent): [number, number] {
  const { start, end, era } = h.dateRange;
  return era === 'BCE' ? [-start, -end] : [start, end];
}

export function formatYear(y: number): string {
  return y < 0 ? `${-y} BCE` : `${y} CE`;
}

export function formatDateRange(h: HistoricalEvent): string {
  const { start, end, era } = h.dateRange;
  const c = h.approximate ? 'c. ' : '';
  return start === end ? `${c}${start} ${era}` : `${c}${start}–${end} ${era}`;
}

export function cite(sourceId: string, ref?: string): string {
  const s = sourcesById.get(sourceId);
  if (!s) return sourceId;
  const r = ref ?? s.ref;
  return `${s.author}, ${s.work}${r ? ' ' + r : ''}`;
}

export function labelOf(sel: Selection | string): string {
  const id = typeof sel === 'string' ? sel : sel.id;
  return (
    entitiesById.get(id)?.name ??
    stagesById.get(id)?.name ??
    mythicEventsById.get(id)?.name ??
    historicalById.get(id)?.name ??
    attestationsById.get(id)?.label ??
    locationsById.get(id)?.ancientName ??
    id
  );
}

export function kindOf(id: string): SelectionKind | null {
  if (entitiesById.has(id)) return 'entity';
  if (stagesById.has(id)) return 'stage';
  if (mythicEventsById.has(id)) return 'mythicEvent';
  if (historicalById.has(id)) return 'historicalEvent';
  if (attestationsById.has(id)) return 'attestation';
  if (locationsById.has(id)) return 'location';
  return null;
}

/** The mythic stage a mythic ref (stage / entity / mythic event) belongs to. */
export function stageOfMythicRef(id: string): MythicStage | undefined {
  if (stagesById.has(id)) return stagesById.get(id);
  const e = entitiesById.get(id);
  if (e) return stagesById.get(e.mythicStage);
  const m = mythicEventsById.get(id);
  if (m) return stagesById.get(m.stage);
  return undefined;
}

const earliest = (a: Attestation, b: Attestation) => signedRange(historicalById.get(a.historicalRef)!)[0] - signedRange(historicalById.get(b.historicalRef)!)[0];

/** All attestations bridging to a mythic ref, earliest historical evidence first. */
export function attestationsFor(mythicId: string): Attestation[] {
  const direct = data.attestations.filter((a) => a.mythicRef === mythicId);
  return direct.sort(earliest);
}

/**
 * Kinds that record a tradition. Archaeological context (a site a story is associated with),
 * syncretism and reception are never a "first attestation".
 */
const RECORDING_KINDS = new Set(['first_attestation', 'literary_codification', 'cult_evidence']);

/**
 * The best "first attested" bridge for a mythic ref, chosen in tiers:
 * 1. direct recordings of the ref itself, 2. recordings of events a figure takes part in,
 * 3. (for stages) recordings of anything in the stage, 4. the figure's stage, 5. any bridge at all.
 * Within a tier the earliest historical evidence wins.
 */
export function firstAttestation(mythicId: string): { attestation: Attestation; via: string } | null {
  const recording = (xs: Attestation[]) => xs.filter((a) => RECORDING_KINDS.has(a.kind)).sort(earliest);
  const direct = attestationsFor(mythicId);
  const tiers: Attestation[][] = [recording(direct)];
  if (entitiesById.has(mythicId)) {
    const evIds = new Set(data.mythicEvents.filter((m) => m.participants.includes(mythicId)).map((m) => m.id));
    tiers.push(recording(data.attestations.filter((a) => evIds.has(a.mythicRef))));
  }
  if (stagesById.has(mythicId)) {
    tiers.push(recording(data.attestations.filter((a) => a.mythicRef !== mythicId && stageOfMythicRef(a.mythicRef)?.id === mythicId)));
  }
  for (const t of tiers) if (t.length) return { attestation: t[0], via: t[0].mythicRef };
  const stage = stageOfMythicRef(mythicId);
  if (stage && stage.id !== mythicId) {
    const viaStage = firstAttestation(stage.id);
    if (viaStage) return viaStage;
  }
  if (direct.length) return { attestation: direct[0], via: mythicId };
  return null;
}

export function periodOf(h: HistoricalEvent) {
  return periodsById.get(h.period);
}

export function eventsForEntity(id: string): MythicEvent[] {
  return data.mythicEvents.filter((m) => m.participants.includes(id));
}

export function locationsForEntity(id: string): Location[] {
  return data.locations.filter((l) => l.linkedEntities.includes(id));
}

export const classificationLabel: Record<string, string> = {
  verified: 'Verified site',
  traditionally_identified: 'Traditionally identified',
  debated: 'Debated identification',
  mythical: 'Mythical — no terrestrial location',
};

export const attestationKindLabel: Record<string, string> = {
  first_attestation: 'First attestation',
  cult_evidence: 'Cult evidence',
  literary_codification: 'Literary codification',
  archaeological_context: 'Archaeological context',
  syncretism: 'Syncretism / identification',
  reception: 'Later reception',
};
