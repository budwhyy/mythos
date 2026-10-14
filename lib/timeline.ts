import { data, historicalById, signedRange, stageOfMythicRef, stagesOrdered } from './data';
import type { Attestation, HistoricalEvent, HistoricalPeriod } from './schema';

export const AXIS_START = -2000;
export const AXIS_END = 600;

export type TrackLayout = {
  width: number;
  height: number;
  railY: number;
  periodTop: number;
  axisY: number;
  stageX: Map<string, number>;
  mythicAnchor: Map<string, { x: number; y: number }>;
  events: { h: HistoricalEvent; x1: number; x2: number; y: number; labelW: number }[];
  periods: { p: HistoricalPeriod; x1: number; x2: number; row: number }[];
  bridges: { a: Attestation; from: { x: number; y: number }; to: { x: number; y: number } }[];
  ticks: { x: number; year: number }[];
  yearToX: (y: number) => number;
};

const PAD = 48;

/**
 * Layout for the dual-frame track.
 * The mythic rail is spaced by ORDER only; the historical axis is linear in years.
 * They share horizontal space but no scale: a mythic stage's x says nothing about a date.
 */
export function layoutTrack(width: number): TrackLayout {
  const railY = 56;
  const yearToX = (y: number) => PAD + ((y - AXIS_START) / (AXIS_END - AXIS_START)) * (width - PAD * 2);

  // Mythic rail: evenly spaced ordinal positions.
  const stageX = new Map<string, number>();
  const step = (width - PAD * 2) / Math.max(1, stagesOrdered.length - 1);
  stagesOrdered.forEach((s, i) => stageX.set(s.id, PAD + i * step));

  // Anchors for every mythic ref used by a bridge: stage node, or a satellite around it.
  const mythicAnchor = new Map<string, { x: number; y: number }>();
  const satellites = new Map<string, number>();
  for (const a of data.attestations) {
    if (mythicAnchor.has(a.mythicRef)) continue;
    const stage = stageOfMythicRef(a.mythicRef);
    if (!stage) continue;
    const sx = stageX.get(stage.id)!;
    if (a.mythicRef === stage.id) {
      mythicAnchor.set(a.mythicRef, { x: sx, y: railY });
    } else {
      const n = satellites.get(stage.id) ?? 0;
      satellites.set(stage.id, n + 1);
      const side = n % 2 === 0 ? 1 : -1;
      const k = Math.floor(n / 2) + 1;
      mythicAnchor.set(a.mythicRef, { x: sx + side * k * 16, y: railY + 22 + (k % 2) * 8 });
    }
  }

  // Periods: greedy rows so overlapping periods don't collide.
  const periodRowsEnd: number[] = [];
  const periods = [...data.periods]
    .sort((a, b) => a.startYear - b.startYear)
    .map((p) => {
      const x1 = yearToX(p.startYear);
      const x2 = yearToX(p.endYear);
      let row = periodRowsEnd.findIndex((end) => end <= x1 + 1);
      if (row === -1) row = periodRowsEnd.length;
      periodRowsEnd[row] = x2;
      return { p, x1, x2, row };
    });

  // Events: lanes above the period bands, greedy by label extent.
  const laneEnds: number[] = [];
  const laneH = 18;
  const events = [...data.historicalEvents]
    .sort((a, b) => signedRange(a)[0] - signedRange(b)[0])
    .map((h) => {
      const [s, e] = signedRange(h);
      const x1 = yearToX(s);
      const x2 = Math.max(yearToX(e), x1 + 3);
      const labelW = Math.min(220, h.name.length * 5.6 + 14);
      const extent = Math.max(x2, x1 + labelW);
      let lane = laneEnds.findIndex((end) => end + 6 <= x1);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = extent;
      return { h, x1, x2, lane, labelW };
    });
  const lanes = Math.max(1, laneEnds.length);
  const periodTop = railY + 90 + lanes * laneH;
  const placed = events.map((e) => ({ h: e.h, x1: e.x1, x2: e.x2, labelW: e.labelW, y: periodTop - 16 - e.lane * laneH }));

  const axisY = periodTop + periodRowsEnd.length * 22 + 10;
  const height = axisY + 34;

  const bridges = data.attestations
    .map((a) => {
      const from = mythicAnchor.get(a.mythicRef);
      const ev = placed.find((p) => p.h.id === a.historicalRef);
      if (!from || !ev) return null;
      return { a, from, to: { x: ev.x1, y: ev.y } };
    })
    .filter((b): b is NonNullable<typeof b> => !!b);

  const ticks: { x: number; year: number }[] = [];
  for (let y = AXIS_START; y <= AXIS_END; y += 200) ticks.push({ x: yearToX(y), year: y });

  return { width, height, railY, periodTop, axisY, stageX, mythicAnchor, events: placed, periods, bridges, ticks, yearToX };
}

export function historicalOf(a: Attestation) {
  return historicalById.get(a.historicalRef)!;
}
