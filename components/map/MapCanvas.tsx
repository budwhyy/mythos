'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { data, locationsById } from '@/lib/data';
import { isMythicPlace, journeyGeometry, lerp, odysseus, placement, type LngLat } from '@/lib/geo';
import { tokens } from '@/lib/tokens';

export type MapLayer = 'myth' | 'ancient' | 'modern';

const STYLE = 'https://tiles.openfreemap.org/styles/dark';
const FALLBACK_STYLE = 'https://demotiles.maplibre.org/style.json';
const FONT = ['Noto Sans Regular'];

const CERTAINTIES = ['verified', 'traditionally_identified', 'debated', 'mythical'] as const;
const DASH: Record<(typeof CERTAINTIES)[number], number[] | undefined> = { verified: undefined, traditionally_identified: [4, 1.5], debated: [2, 2], mythical: [0.6, 1.8] };

function placesGeoJSON() {
  const features: GeoJSON.Feature[] = [];
  for (const l of data.locations) {
    const p = placement(l);
    if (p) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p.lngLat },
        properties: {
          id: l.id,
          ancient: p.kind === 'proposed' ? `${l.ancientName}?` : l.ancientName,
          modern: l.modernName,
          cls: l.classification,
          proposed: p.kind === 'proposed',
          mythic: isMythicPlace(l),
          periods: `|${l.periods.join('|')}|`,
        },
      });
    }
    // Secondary identifications for real places (e.g. Ithaca → Paliki), always hollow.
    if (l.coords)
      for (const alt of l.alternatives ?? [])
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [alt.coords.lng, alt.coords.lat] },
          properties: { id: l.id, ancient: `${l.ancientName}? (alt.)`, modern: alt.label, cls: 'debated', proposed: true, mythic: true, periods: '||' },
        });
  }
  return { type: 'FeatureCollection' as const, features };
}

function journeyGeoJSON() {
  const features: GeoJSON.Feature[] = journeyGeometry(odysseus)
    .filter((g) => g.drawable)
    .map((g) => ({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [g.from!.lngLat, g.to!.lngLat] },
      properties: { index: g.index, certainty: g.leg.certainty },
    }));
  return { type: 'FeatureCollection' as const, features };
}

type Props = {
  layer: MapLayer;
  era: string;
  globe: boolean;
  showJourney: boolean;
  activeLeg: number | null;
  progress: number;
  selectedId: string | null;
  reduced: boolean;
  onSelect: (id: string) => void;
  onError: (msg: string) => void;
};

export default function MapCanvas({ layer, era, globe, showJourney, activeLeg, progress, selectedId, reduced, onSelect, onError }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [styleVersion, setStyleVersion] = useState(0);
  const ready = styleVersion > 0;
  const baseLabelLayers = useRef<string[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const triedFallback = useRef(false);

  useEffect(() => {
    if (!el.current) return;
    const map = new maplibregl.Map({
      container: el.current,
      style: STYLE,
      center: [20.5, 38.5],
      zoom: 4.2,
      attributionControl: { compact: true },
      fadeDuration: reduced ? 0 : 300,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.keyboard.enable();

    map.on('error', (e) => {
      const msg = String((e as { error?: Error }).error?.message ?? '');
      if (!triedFallback.current && /style|Failed to fetch|NetworkError/i.test(msg) && !map.isStyleLoaded()) {
        triedFallback.current = true;
        map.setStyle(FALLBACK_STYLE);
        onError('The detailed basemap could not load; showing a simplified basemap.');
      }
    });

    map.on('style.load', () => {
      baseLabelLayers.current = (map.getStyle().layers ?? []).filter((l) => l.type === 'symbol').map((l) => l.id);

      map.addSource('places', { type: 'geojson', data: placesGeoJSON() });
      map.addSource('journey', { type: 'geojson', data: journeyGeoJSON() });
      map.addSource('journey-active', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('ship', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      for (const c of CERTAINTIES) {
        map.addLayer({
          id: `journey-${c}`,
          type: 'line',
          source: 'journey',
          filter: ['==', ['get', 'certainty'], c],
          paint: { 'line-color': tokens.color[c], 'line-width': 2, 'line-opacity': 0.75, ...(DASH[c] ? { 'line-dasharray': DASH[c] } : {}) },
          layout: { 'line-cap': 'round' },
        });
      }
      map.addLayer({ id: 'journey-active', type: 'line', source: 'journey-active', paint: { 'line-color': tokens.color.marble, 'line-width': 4.5, 'line-opacity': 0.9 } });

      map.addLayer({
        id: 'places-circle',
        type: 'circle',
        source: 'places',
        paint: {
          'circle-radius': 6,
          'circle-color': ['match', ['get', 'cls'], 'verified', tokens.color.verified, 'traditionally_identified', tokens.color.traditionally_identified, 'debated', tokens.color.debated, tokens.color.mythical],
          'circle-opacity': ['case', ['get', 'proposed'], 0, 0.95],
          'circle-stroke-width': ['case', ['get', 'proposed'], 2, 1.2],
          'circle-stroke-color': ['case', ['get', 'proposed'], ['match', ['get', 'cls'], 'mythical', tokens.color.mythical, tokens.color.debated], tokens.color.cosmos],
        },
      });
      map.addLayer({
        id: 'places-label',
        type: 'symbol',
        source: 'places',
        layout: {
          'text-field': ['get', 'ancient'],
          'text-font': FONT,
          'text-size': 12,
          'text-offset': [0, 1.1],
          'text-anchor': 'top',
          'text-optional': true,
        },
        paint: { 'text-color': tokens.color.marble, 'text-halo-color': tokens.color.cosmos, 'text-halo-width': 1.4 },
      });
      map.addLayer({
        id: 'ship',
        type: 'circle',
        source: 'ship',
        paint: { 'circle-radius': 7, 'circle-color': tokens.color.gold, 'circle-stroke-color': tokens.color.marble, 'circle-stroke-width': 2 },
      });

      setStyleVersion((v) => v + 1);
    });

    map.on('click', 'places-circle', (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (id) onSelectRef.current(String(id));
    });
    map.on('mouseenter', 'places-circle', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'places-circle', () => (map.getCanvas().style.cursor = ''));

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Layer: which places, which names, whether basemap (modern) labels show.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const filter: maplibregl.FilterSpecification =
      layer === 'myth'
        ? ['==', ['get', 'mythic'], true]
        : layer === 'ancient'
          ? era === 'all'
            ? ['all', ['!', ['get', 'proposed']], ['!=', ['get', 'periods'], '||']]
            : ['all', ['!', ['get', 'proposed']], ['in', `|${era}|`, ['get', 'periods']]]
          : ['!', ['get', 'proposed']];
    map.setFilter('places-circle', filter);
    map.setFilter('places-label', filter);
    map.setLayoutProperty('places-label', 'text-field', layer === 'modern' ? ['get', 'modern'] : ['get', 'ancient']);
    map.setLayoutProperty('places-label', 'text-font', layer === 'modern' ? FONT : ['Noto Sans Italic']);
    for (const id of baseLabelLayers.current) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', layer === 'modern' ? 'visible' : 'none');
  }, [layer, era, styleVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const c of CERTAINTIES) map.setLayoutProperty(`journey-${c}`, 'visibility', showJourney ? 'visible' : 'none');
    for (const id of ['journey-active', 'ship']) map.setLayoutProperty(id, 'visibility', showJourney ? 'visible' : 'none');
  }, [showJourney, styleVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    try {
      map.setProjection({ type: globe ? 'globe' : 'mercator' });
    } catch {
      /* projection unsupported: stay flat */
    }
  }, [globe, styleVersion]);

  // Journey: highlight the active leg and move the ship along it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const geo = activeLeg === null ? null : journeyGeometry(odysseus)[activeLeg];
    const active = map.getSource('journey-active') as GeoJSONSource | undefined;
    const ship = map.getSource('ship') as GeoJSONSource | undefined;
    if (!geo || !geo.drawable) {
      active?.setData({ type: 'FeatureCollection', features: [] });
      const at = geo?.from?.lngLat ?? geo?.to?.lngLat;
      ship?.setData({ type: 'FeatureCollection', features: at ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: at }, properties: {} }] : [] });
      return;
    }
    active?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [geo.from!.lngLat, geo.to!.lngLat] }, properties: {} });
    const pos: LngLat = lerp(geo.from!.lngLat, geo.to!.lngLat, progress);
    ship?.setData({ type: 'Feature', geometry: { type: 'Point', coordinates: pos }, properties: {} });
  }, [activeLeg, progress, styleVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const l = locationsById.get(selectedId);
    const p = l && placement(l);
    if (p) map.flyTo({ center: p.lngLat, zoom: Math.max(map.getZoom(), 5), duration: reduced ? 0 : 1200, essential: true });
  }, [selectedId, ready, reduced]);

  return <div ref={el} className="h-full w-full" role="region" aria-label="Interactive map. Use the place list for keyboard access." />;
}
