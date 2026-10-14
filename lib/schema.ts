import { z } from 'zod';

/**
 * MYTHOS data schemas.
 *
 * The two-clock principle is enforced here:
 *  - `mythic` records (entities, stages, mythic events) are `.strict()` and have no date fields.
 *    Any extra key — e.g. `date`, `year`, `dateRange` — fails validation.
 *  - `historical` records carry dates, confidence and evidence type.
 *  - `attestation` records bridge one mythic ref to one historical ref.
 * `validateDataset` adds the cross-record integrity rules.
 */

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lowercase kebab-case');

export const SourceSchema = z
  .object({
    id,
    author: z.string().min(1),
    work: z.string().min(1),
    ref: z.string().optional(),
    url: z.string().url().optional(),
    kind: z.enum(['ancient', 'modern']).default('ancient'),
  })
  .strict();

export const MythicStageSchema = z
  .object({
    id,
    name: z.string(),
    order: z.number().int().nonnegative(), // ordinal position, NOT a date
    tagline: z.string(),
    description: z.string(),
    sources: z.array(z.string()).min(1),
  })
  .strict();

export const EntityTypeSchema = z.enum(['primordial', 'titan', 'olympian', 'hero', 'mortal', 'creature', 'place']);

export const EntitySchema = z
  .object({
    id,
    name: z.string(),
    greek: z.string().optional(),
    type: EntityTypeSchema,
    titles: z.array(z.string()).optional(),
    domains: z.array(z.string()).optional(),
    summary: z
      .object({ beginner: z.string().min(1), intermediate: z.string().min(1), scholarly: z.string().min(1) })
      .strict(),
    mythicStage: z.string(), // ordinal stage id only
    sources: z.array(z.string()).min(1, 'every entity needs at least one source'),
    sourceRefs: z.record(z.string(), z.string()).optional(), // sourceId -> line/section reference
  })
  .strict();

export const RelationshipKindSchema = z.enum(['parent', 'partner', 'sibling', 'conflict', 'alliance']);

export const RelationshipSchema = z
  .object({
    id,
    from: z.string(),
    to: z.string(),
    kind: RelationshipKindSchema,
    source: z.string(), // one source per edge; conflicting accounts = separate edges
    ref: z.string().optional(),
    note: z.string().optional(),
  })
  .strict();

export const MythicEventSchema = z
  .object({
    id,
    frame: z.literal('mythic'),
    name: z.string(),
    stage: z.string(),
    before: z.array(z.string()).optional(),
    after: z.array(z.string()).optional(),
    participants: z.array(z.string()),
    summary: z.string(),
    sources: z.array(z.string()).min(1),
    sourceRefs: z.record(z.string(), z.string()).optional(),
  })
  .strict();

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);
export const EvidenceTypeSchema = z.enum(['archaeological', 'epigraphic', 'literary']);

export const DateRangeSchema = z
  .object({ start: z.number().int().nonnegative(), end: z.number().int().nonnegative(), era: z.enum(['BCE', 'CE']) })
  .strict()
  .refine((d) => (d.era === 'BCE' ? d.start >= d.end : d.start <= d.end), {
    message: 'BCE ranges count down (start >= end); CE ranges count up (start <= end)',
  });

export const HistoricalEventSchema = z
  .object({
    id,
    frame: z.literal('historical'),
    name: z.string(),
    period: z.string(),
    dateRange: DateRangeSchema,
    approximate: z.boolean().default(true),
    confidence: ConfidenceSchema,
    evidenceType: EvidenceTypeSchema,
    summary: z.string(),
    uncertainty: z.string().optional(),
    sources: z.array(z.string()).min(1),
    sourceRefs: z.record(z.string(), z.string()).optional(),
  })
  .strict();

export const HistoricalPeriodSchema = z
  .object({
    id,
    name: z.string(),
    // signed years: negative = BCE, positive = CE. Periods are conventions; edges are fuzzy.
    startYear: z.number().int(),
    endYear: z.number().int(),
    description: z.string(),
  })
  .strict()
  .refine((p) => p.startYear < p.endYear, { message: 'period must start before it ends' });

export const AttestationKindSchema = z.enum(['first_attestation', 'cult_evidence', 'literary_codification', 'syncretism', 'reception']);

export const AttestationSchema = z
  .object({
    id,
    frame: z.literal('attestation'),
    kind: AttestationKindSchema,
    mythicRef: z.string(), // stage, entity or mythic event id
    historicalRef: z.string(), // historical event id
    label: z.string(),
    note: z.string(),
    sources: z.array(z.string()).min(1),
  })
  .strict();

const CoordsSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).strict();

export const ClassificationSchema = z.enum(['verified', 'traditionally_identified', 'debated', 'mythical']);

export const LocationSchema = z
  .object({
    id,
    ancientName: z.string(),
    greek: z.string().optional(),
    modernName: z.string(),
    country: z.string().optional(),
    classification: ClassificationSchema,
    coords: CoordsSchema.optional(), // forbidden when classification === 'mythical'
    alternatives: z.array(z.object({ label: z.string(), coords: CoordsSchema, source: z.string() }).strict()).optional(),
    symbolic: z.object({ x: z.number(), y: z.number() }).strict().optional(), // position on the symbolic (non-terrestrial) map, 0..100
    periods: z.array(z.string()).default([]), // historical period ids in which the site is archaeologically/historically active
    ancientNote: z.string(),
    modernNote: z.string(),
    linkedEntities: z.array(z.string()),
    linkedEvents: z.array(z.string()),
    sources: z.array(z.string()).min(1),
    confidenceNote: z.string().optional(),
  })
  .strict();

export const JourneyLegSchema = z
  .object({
    from: z.string(),
    to: z.string(),
    certainty: ClassificationSchema,
    label: z.string(),
    ref: z.string(),
    note: z.string(),
  })
  .strict();

export const JourneySchema = z
  .object({ id, name: z.string(), hero: z.string(), mythicEvent: z.string(), source: z.string(), legs: z.array(JourneyLegSchema).min(1) })
  .strict();

export const LearningStepSchema = z
  .object({
    id,
    title: z.string(),
    body: z.string(),
    mode: z.enum(['timeline', 'tree', 'character', 'map', 'relationship']),
    focus: z.string().optional(),
    takeaway: z.string(),
  })
  .strict();

export type Source = z.infer<typeof SourceSchema>;
export type MythicStage = z.infer<typeof MythicStageSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type RelationshipKind = z.infer<typeof RelationshipKindSchema>;
export type MythicEvent = z.infer<typeof MythicEventSchema>;
export type HistoricalEvent = z.infer<typeof HistoricalEventSchema>;
export type HistoricalPeriod = z.infer<typeof HistoricalPeriodSchema>;
export type Attestation = z.infer<typeof AttestationSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Classification = z.infer<typeof ClassificationSchema>;
export type Journey = z.infer<typeof JourneySchema>;
export type LearningStep = z.infer<typeof LearningStepSchema>;

export type RawDataset = {
  sources: unknown;
  stages: unknown;
  entities: unknown;
  relationships: unknown;
  mythicEvents: unknown;
  historicalEvents: unknown;
  periods: unknown;
  attestations: unknown;
  locations: unknown;
  journeys: unknown;
  learning: unknown;
};

export type Dataset = {
  sources: Source[];
  stages: MythicStage[];
  entities: Entity[];
  relationships: Relationship[];
  mythicEvents: MythicEvent[];
  historicalEvents: HistoricalEvent[];
  periods: HistoricalPeriod[];
  attestations: Attestation[];
  locations: Location[];
  journeys: Journey[];
  learning: LearningStep[];
};

/** Keys that would smuggle absolute time into a mythic record. */
const DATE_KEYS = /^(date|dates|daterange|year|years|start|end|era|bce|ce|century|startyear|endyear)$/i;
/** Text that reads as an absolute date, e.g. "700 BCE", "c. 1200", "8th century BC". */
const DATE_TEXT = /\b\d{2,4}\s*(BCE|BC|CE|AD)\b|\bc\.\s*\d{3,4}\b|\b\d{1,2}(st|nd|rd|th)[\s-]century\b/i;

function scanForDates(value: unknown, path: string, issues: string[]) {
  if (Array.isArray(value)) value.forEach((v, i) => scanForDates(v, `${path}[${i}]`, issues));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (DATE_KEYS.test(k)) issues.push(`${path}.${k}: mythic records may not carry date fields`);
      scanForDates(v, `${path}.${k}`, issues);
    }
  } else if (typeof value === 'string' && DATE_TEXT.test(value)) {
    issues.push(`${path}: mythic text contains an absolute date ("${value.match(DATE_TEXT)![0]}")`);
  }
}

/** Raw-data check: runs before Zod so that a stray `date` is reported with a clear message. */
export function findMythicDates(raw: Pick<RawDataset, 'stages' | 'entities' | 'mythicEvents'>): string[] {
  const issues: string[] = [];
  scanForDates(raw.stages, 'stages', issues);
  scanForDates(raw.entities, 'entities', issues);
  scanForDates(raw.mythicEvents, 'mythicEvents', issues);
  return issues;
}

export type ValidationResult = { ok: true; data: Dataset } | { ok: false; errors: string[] };

export function validateDataset(raw: RawDataset): ValidationResult {
  const errors: string[] = [...findMythicDates(raw)];

  const parse = <T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, value: unknown, label: string): T[] => {
    const res = z.array(schema).safeParse(value);
    if (!res.success) {
      for (const issue of res.error.issues) errors.push(`${label}${issue.path.length ? '[' + issue.path.join('.') + ']' : ''}: ${issue.message}`);
      return [];
    }
    return res.data;
  };

  const data: Dataset = {
    sources: parse(SourceSchema, raw.sources, 'sources'),
    stages: parse(MythicStageSchema, raw.stages, 'stages'),
    entities: parse(EntitySchema, raw.entities, 'entities'),
    relationships: parse(RelationshipSchema, raw.relationships, 'relationships'),
    mythicEvents: parse(MythicEventSchema, raw.mythicEvents, 'mythicEvents'),
    historicalEvents: parse(HistoricalEventSchema, raw.historicalEvents, 'historicalEvents'),
    periods: parse(HistoricalPeriodSchema, raw.periods, 'periods'),
    attestations: parse(AttestationSchema, raw.attestations, 'attestations'),
    locations: parse(LocationSchema, raw.locations, 'locations'),
    journeys: parse(JourneySchema, raw.journeys, 'journeys'),
    learning: parse(LearningStepSchema, raw.learning, 'learning'),
  };

  errors.push(...integrityErrors(data));
  return errors.length ? { ok: false, errors } : { ok: true, data };
}

export function integrityErrors(d: Dataset): string[] {
  const errors: string[] = [];
  const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id));
  const sourceIds = ids(d.sources);
  const stageIds = ids(d.stages);
  const entityIds = ids(d.entities);
  const mythicEventIds = ids(d.mythicEvents);
  const histIds = ids(d.historicalEvents);
  const periodIds = ids(d.periods);
  const locationIds = ids(d.locations);

  const dupes = (label: string, xs: { id: string }[]) => {
    const seen = new Set<string>();
    for (const x of xs) {
      if (seen.has(x.id)) errors.push(`${label}: duplicate id "${x.id}"`);
      seen.add(x.id);
    }
  };
  dupes('sources', d.sources);
  dupes('stages', d.stages);
  dupes('entities', d.entities);
  dupes('relationships', d.relationships);
  dupes('mythicEvents', d.mythicEvents);
  dupes('historicalEvents', d.historicalEvents);
  dupes('attestations', d.attestations);
  dupes('locations', d.locations);

  const needSources = (label: string, srcs: string[]) => {
    if (srcs.length === 0) errors.push(`${label}: has zero sources`);
    for (const s of srcs) if (!sourceIds.has(s)) errors.push(`${label}: unknown source "${s}"`);
  };

  for (const s of d.stages) needSources(`stage ${s.id}`, s.sources);

  for (const e of d.entities) {
    needSources(`entity ${e.id}`, e.sources);
    if (!stageIds.has(e.mythicStage)) errors.push(`entity ${e.id}: unknown mythicStage "${e.mythicStage}"`);
    for (const k of Object.keys(e.sourceRefs ?? {})) if (!e.sources.includes(k)) errors.push(`entity ${e.id}: sourceRef for unlisted source "${k}"`);
  }

  for (const r of d.relationships) {
    if (!entityIds.has(r.from)) errors.push(`relationship ${r.id}: unknown entity "${r.from}"`);
    if (!entityIds.has(r.to)) errors.push(`relationship ${r.id}: unknown entity "${r.to}"`);
    if (r.from === r.to) errors.push(`relationship ${r.id}: self-loop`);
    if (!sourceIds.has(r.source)) errors.push(`relationship ${r.id}: unknown source "${r.source}"`);
  }

  for (const m of d.mythicEvents) {
    needSources(`mythicEvent ${m.id}`, m.sources);
    if (!stageIds.has(m.stage)) errors.push(`mythicEvent ${m.id}: unknown stage "${m.stage}"`);
    for (const p of m.participants) if (!entityIds.has(p)) errors.push(`mythicEvent ${m.id}: unknown participant "${p}"`);
    for (const ref of [...(m.before ?? []), ...(m.after ?? [])]) if (!mythicEventIds.has(ref)) errors.push(`mythicEvent ${m.id}: unknown sequence ref "${ref}"`);
  }

  for (const h of d.historicalEvents) {
    needSources(`historicalEvent ${h.id}`, h.sources);
    if (!periodIds.has(h.period)) errors.push(`historicalEvent ${h.id}: unknown period "${h.period}"`);
  }

  for (const a of d.attestations) {
    needSources(`attestation ${a.id}`, a.sources);
    const mythicOk = stageIds.has(a.mythicRef) || entityIds.has(a.mythicRef) || mythicEventIds.has(a.mythicRef);
    if (!mythicOk) errors.push(`attestation ${a.id}: mythicRef "${a.mythicRef}" is not a stage, entity or mythic event`);
    if (!histIds.has(a.historicalRef)) errors.push(`attestation ${a.id}: historicalRef "${a.historicalRef}" is not a historical event`);
  }

  for (const l of d.locations) {
    needSources(`location ${l.id}`, l.sources);
    if (l.classification === 'mythical' && l.coords) errors.push(`location ${l.id}: mythical locations may not have coords`);
    if (l.classification === 'mythical' && !l.symbolic) errors.push(`location ${l.id}: mythical locations need a symbolic-map position`);
    if (l.classification !== 'mythical' && !l.coords) errors.push(`location ${l.id}: non-mythical locations need coords`);
    for (const alt of l.alternatives ?? []) if (!sourceIds.has(alt.source)) errors.push(`location ${l.id}: alternative "${alt.label}" has unknown source "${alt.source}"`);
    for (const e of l.linkedEntities) if (!entityIds.has(e)) errors.push(`location ${l.id}: unknown linked entity "${e}"`);
    for (const e of l.linkedEvents) if (!mythicEventIds.has(e) && !histIds.has(e)) errors.push(`location ${l.id}: unknown linked event "${e}"`);
    for (const p of l.periods) if (!periodIds.has(p)) errors.push(`location ${l.id}: unknown period "${p}"`);
  }

  for (const j of d.journeys) {
    if (!sourceIds.has(j.source)) errors.push(`journey ${j.id}: unknown source "${j.source}"`);
    if (!entityIds.has(j.hero)) errors.push(`journey ${j.id}: unknown hero "${j.hero}"`);
    if (!mythicEventIds.has(j.mythicEvent)) errors.push(`journey ${j.id}: unknown mythic event "${j.mythicEvent}"`);
    j.legs.forEach((leg, i) => {
      for (const end of [leg.from, leg.to]) if (!locationIds.has(end)) errors.push(`journey ${j.id} leg ${i}: unknown location "${end}"`);
      if (i > 0 && j.legs[i - 1].to !== leg.from) errors.push(`journey ${j.id} leg ${i}: does not continue from previous leg`);
    });
  }

  for (const s of d.learning) {
    if (s.focus && !(entityIds.has(s.focus) || stageIds.has(s.focus) || locationIds.has(s.focus) || mythicEventIds.has(s.focus) || histIds.has(s.focus)))
      errors.push(`learning ${s.id}: unknown focus "${s.focus}"`);
  }

  return errors;
}
