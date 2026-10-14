import sources from '@/data/sources.json';
import stages from '@/data/stages.json';
import entities from '@/data/entities.json';
import relationships from '@/data/relationships.json';
import mythicEvents from '@/data/mythic-events.json';
import historicalEvents from '@/data/historical-events.json';
import periods from '@/data/periods.json';
import attestations from '@/data/attestations.json';
import locations from '@/data/locations.json';
import journeys from '@/data/journeys.json';
import learning from '@/data/learning.json';
import type { RawDataset } from './schema';

export const raw: RawDataset = {
  sources, stages, entities, relationships, mythicEvents, historicalEvents, periods, attestations, locations, journeys, learning,
};
