import { data, locationsById } from './data';
import type { Journey, Location } from './schema';

export type LngLat = [number, number];

/**
 * Where a location can be drawn on Earth.
 * - `site`: its own coordinates (verified / traditional / debated-with-a-leading-proposal).
 * - `proposed`: a mythical place's sourced ancient identification — drawn hollow and labelled as such.
 * - null: mythical with no identification — symbolic map only. Never an invented pin.
 */
export function placement(l: Location): { lngLat: LngLat; kind: 'site' | 'proposed'; label?: string } | null {
  if (l.coords) return { lngLat: [l.coords.lng, l.coords.lat], kind: 'site' };
  const alt = l.alternatives?.[0];
  if (alt) return { lngLat: [alt.coords.lng, alt.coords.lat], kind: 'proposed', label: alt.label };
  return null;
}

export type JourneyLegGeo = {
  index: number;
  leg: Journey['legs'][number];
  from: ReturnType<typeof placement>;
  to: ReturnType<typeof placement>;
  drawable: boolean;
};

export function journeyGeometry(j: Journey): JourneyLegGeo[] {
  return j.legs.map((leg, index) => {
    const from = placement(locationsById.get(leg.from)!);
    const to = placement(locationsById.get(leg.to)!);
    return { index, leg, from, to, drawable: !!from && !!to };
  });
}

export const odysseus = data.journeys.find((j) => j.hero === 'odysseus')!;

export function lerp(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Is a location active in a historical period? Locations with no periods are never filtered in by era. */
export function activeIn(l: Location, periodId: string | 'all'): boolean {
  if (periodId === 'all') return true;
  return l.periods.includes(periodId);
}

/** Is a location part of the mythological world (linked to any mythic event or figure)? */
export function isMythicPlace(l: Location): boolean {
  return l.classification === 'mythical' || l.linkedEvents.some((e) => data.mythicEvents.some((m) => m.id === e));
}
