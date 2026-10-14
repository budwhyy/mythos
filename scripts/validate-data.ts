/* Build-time gate: `npm run build` runs this first. Any violation of the two-clock model fails the build. */
import { raw } from '../lib/raw';
import { validateDataset } from '../lib/schema';

const res = validateDataset(raw);
if (!res.ok) {
  console.error(`\n✗ MYTHOS data validation failed (${res.errors.length} problem${res.errors.length === 1 ? '' : 's'}):`);
  for (const e of res.errors) console.error('  - ' + e);
  process.exit(1);
}
const d = res.data;
console.log(
  `✓ MYTHOS data valid: ${d.entities.length} entities, ${d.relationships.length} relationships, ${d.mythicEvents.length} mythic events, ` +
    `${d.historicalEvents.length} historical events, ${d.attestations.length} attestations, ${d.locations.length} locations, ${d.sources.length} sources`,
);
