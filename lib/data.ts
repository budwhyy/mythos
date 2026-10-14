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

const result = validateDataset(raw);
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
 * The best "first attested" bridge for a mythic ref: a direct attestation if one exists,
 * otherwise one for a mythic event it takes part in, otherwise one for its stage.
 */
export function firstAttestation(mythicId: string): { attestation: Attestation; via: string } | null {
  const direct = attestationsFor(mythicId);
  if (direct.length) return { attestation: direct[0], via: mythicId };
  if (entitiesById.has(mythicId)) {
    const evIds = data.mythicEvents.filter((m) => m.participants.includes(mythicId)).map((m) => m.id);
    const viaEvents = data.attestations.filter((a) => evIds.includes(a.mythicRef)).sort(earliest);
    if (viaEvents.length) return { attestation: viaEvents[0], via: viaEvents[0].mythicRef };
  }
  const stage = stageOfMythicRef(mythicId);
  if (stage && stage.id !== mythicId) {
    const viaStage = attestationsFor(stage.id);
    if (viaStage.length) return { attestation: viaStage[0], via: stage.id };
  }
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
  syncretism: 'Syncretism / identification',
  reception: 'Later reception',
};
