# MYTHOS

**An interactive 3D atlas of Greek mythology that never puts myth on a calendar.**

> *Before the gods, before Olympus, before time had a story — there was Chaos.*

- **Live site:** https://mythos-atlas-898.netlify.app
- **Netlify site ID:** `c904cdb2-6b1d-47d2-aa11-409f30836d35`
- **Repository:** https://github.com/budwhyy/mythos

MYTHOS is a static Next.js app with a cinematic 3D mythic sequence, a dated historical track, a 3D genealogy of 62 figures, a classified map with Odysseus' voyage, and a guided learning path. Every claim in the data is tied to an ancient text or a piece of modern scholarship.

---

## The two-clock model

Mythological time and historical time are **never placed on the same axis**.

| Frame | What it is | Allowed fields | Example |
|---|---|---|---|
| `mythic` | Ordinal sequence only | `order`, `before[]`, `after[]`, `sources` — **no dates** | Chaos → Titanomachy → Olympian Age → Trojan War |
| `historical` | Dated, evidence-graded | `dateRange`, `confidence`, `evidenceType`, `sources` | Pylos Linear B tablets, c. 1200–1180 BCE |
| `attestation` | Bridge between the two | `mythicRef`, `historicalRef`, `kind`, `note`, `sources` | "Zeus named on Pylos tablets" |

An attestation says *this tradition is recorded or evidenced here*. It never says *this story happened here*. Attestation kinds:

- `first_attestation`, `literary_codification` and `cult_evidence` record a tradition. Only these count as "First attested".
- `archaeological_context` is a real site the story is associated with, such as Troy at Hisarlik.
- `syncretism` is a later identification with another culture's god (Zeus Ammon, Capitoline Jupiter). It is never treated as identity.
- `reception` is later reworking (Herodotus, Apollodorus, the Theodosian edicts).

**Enforcement.** `npm run build` first runs `scripts/validate-data.ts`. The build fails if:

- a mythic record (stage, entity or mythic event) carries a date-like field, or its text contains an absolute date such as "700 BCE" or "c. 1200";
- a `mythical` location has coordinates;
- any entity has zero sources, or any record cites an unknown source;
- a relationship, event, attestation, location or journey references an unknown id.

**The Trojan War is the deliberate hinge.** It is a mythic event (`trojan-war-myth`) in the sequence, and the Hisarlik destruction layers are a separate historical event. Two different bridges connect them: a *literary codification* (the Iliad) and an *archaeological context* (Hisarlik).

Every "Where am I?" bar shows both clocks, for example *Mythic: Age of Titans · First attested: Mycenaean, c. 1200–1180 BCE (Linear B tablets at Pylos)*.

---

## Modes

| Mode | Route | What it does |
|---|---|---|
| Opening + Timeline | `/`, `/timeline/` | 3D constellation stages (no ruler), with the camera travelling between them. Below: a dated historical axis with period bands, confidence-coloured events, and dashed attestation bridges you can click. Also has a 2D stage list and a text table of bridges. |
| Family Tree | `/tree/` | 3D force graph layered by generation. Five edge styles (parent, partner, sibling, conflict, alliance). Source toggles for conflicting genealogies, plus expand/collapse generations, isolate a branch, and trace a path. 2D canvas fallback and text list. |
| Character | `/character/` | Name, Greek spelling, titles, domains, beginner/intermediate/scholarly summaries, mythic position, attestations, sourced relationships, events, places and citations. |
| Map | `/map/` | MapLibre with Mythological World, Ancient Historical and Modern layers. Classification badges (verified / traditionally identified / debated / mythical). Hollow rings mark proposed identifications. Includes a symbolic cosmos map for unlocated places, an animated Odysseus journey with per-leg certainty, and an optional globe. |
| Relationship | `/relationship/` | Pick two figures to get a sourced path, direct links, shared stories and shared places. |
| Learning | `/learn/` | An 8-step guided path for beginners. |
| Civilizations, Story | `/compare/`, `/story/` | Honest "coming soon" stubs. |

Also included: global search (press `/`), bookmarks, visit history with Back, reading level, and a 2D/3D switch. Reduced-motion users get 2D views by default.

---

## Data model

All content lives in [`/data`](data) as JSON and is validated by the Zod schemas in [`lib/schema.ts`](lib/schema.ts).

| File | Type | Count |
|---|---|---|
| `sources.json` | `Source` — ancient texts and modern scholarship | 51 |
| `stages.json` | `MythicStage` — ordinal stages, `order` only | 8 |
| `entities.json` | `Entity` — gods, Titans, heroes, mortals, creatures | 62 |
| `relationships.json` | `Relationship` — one source per edge (generated, see below) | 165 |
| `mythic-events.json` | `MythicEvent` — `before`/`after`, never dates | 29 |
| `historical-events.json` | `HistoricalEvent` — `dateRange`, `confidence`, `evidenceType` | 26 |
| `periods.json` | `HistoricalPeriod` — conventional period bands (signed years) | 8 |
| `attestations.json` | `Attestation` — bridges | 28 |
| `locations.json` | `Location` — classified places; `coords` forbidden if `mythical` | 39 |
| `journeys.json` | `Journey` — Odysseus' return, 15 legs with certainty | 1 |
| `learning.json` | `LearningStep` — the guided path | 8 |

The core types follow the build brief exactly. These extensions were added:

- `Entity.sourceRefs` (line or section per source)
- `Relationship.ref` and `note`
- `MythicEvent.summary` and `sourceRefs`
- `HistoricalEvent.period`, `approximate` and `uncertainty`
- `Attestation.kind` and `label`
- `Location.symbolic` (position on the symbolic map), `periods`, `ancientNote` and `modernNote`

**Conflicting genealogies** are separate edges, each tagged with its source. For example, Aphrodite has `uranus → aphrodite` from Hesiod, *Theogony* 188–206, and `zeus → aphrodite` plus `dione → aphrodite` from Homer, *Iliad* 5.370–372. The Family Tree source toggles switch them on and off. Other conflicted figures are Hephaestus, Athena, Dionysus, Dione and Eros.

---

## Images

Figures are illustrated with photographs of **real artefacts that depict them** — vase paintings, marble heads, reliefs — never invented likenesses. 45 of 62 figures have one; the rest (Tartarus, Aether, the obscure Titans, the Hundred-Handers, Calypso and a few others) have no usable ancient depiction and show a marble medallion with their Greek initial instead.

- Sources: the Met Open Access collection (CC0) and Wikimedia Commons (public domain, CC0 or CC BY/BY-SA, attribution shown in the panel).
- Each `Entity.image` records the object title, its own date (`objectDate`), the museum credit, photographer where required, licence and a link back.
- **Two-clock rule:** an artefact's date is a fact about the object, so the `image` subtree is exempt from the mythic-date check. Mythic prose still may not carry dates; a test pins this.
- Bundled under `public/img/figures/` as a 1000px hero and a 320px square thumb (used as the node in the family tree).

To change or add a picture: run `node scripts/images/probe.mjs` (collects candidates), `node scripts/images/sheets.mjs` (renders contact sheets for review), set the choice in `data/images/picks.json`, then `node scripts/images/build.mjs`.

## Adding content

1. **Add a source** to `data/sources.json` if needed (`kind: "ancient"` or `"modern"`).
2. **Add an entity** to `data/entities.json`. It needs:
   - `summary.beginner`, `intermediate` and `scholarly` — original writing, **no absolute dates**;
   - a `mythicStage` id;
   - at least one `sources` id, plus `sourceRefs` for line numbers.
3. **Add relationships** as rows in `scripts/build-relationships.mjs` in the form `[kind, from, to, sourceId, ref, note?]`. Parent edges run parent → child; a rival account is a second row with a different source. Then run:
   ```bash
   node scripts/build-relationships.mjs
   ```
4. **Dated evidence** goes in `historical-events.json`. Link it to myth with an `attestations.json` entry, picking the honest `kind`.
5. **Places** go in `locations.json`. Use `mythical` with a `symbolic` position for anything with no defensible coordinates. Ancient identifications of mythical places go in `alternatives` with a source, and are drawn as hollow "proposed" rings.
6. Validate:
   ```bash
   npm run validate
   ```
   ```bash
   npm test
   ```

---

## Running locally

Requires Node 20+.

```bash
npm install
```
```bash
npm run dev
```

Dev server runs at http://localhost:3000.

```bash
npm run build
```

This validates the data, then writes the static export to `out/`.

```bash
npm test
```

Vitest: schema, two-clock rules, data integrity, graph and geo logic.

```bash
npx playwright install chromium
```
```bash
npm run test:e2e
```

Playwright smoke tests, one per mode, run against `out/`.

## Stack

Next.js 15 (App Router, `output: 'export'`) · TypeScript · React Three Fiber + drei · react-force-graph-3d / -2d · MapLibre GL JS with OpenFreeMap tiles (no API key) · Zod · Zustand · Tailwind CSS v4 · Vitest · Playwright. Design tokens are in [`lib/tokens.ts`](lib/tokens.ts): gold `#C9A227`, bronze `#8C6A3F`, marble `#E8E4DC`, cosmos `#070912`. Type is Cormorant Garamond with Inter.

## Deployment

Netlify serves `out/` as a static site (see [`netlify.toml`](netlify.toml)). Pushes to `main` deploy continuously.

## Content standards

- Original writing only.
- Myth, ancient literary sources, archaeology and modern scholarship are labelled separately in each panel.
- Uncertainty is shown, not hidden.
- Two deities are never presented as identical: identifications appear as `syncretism` bridges.
- See [`BUILD_LOG.md`](BUILD_LOG.md) for assumptions, known gaps, and the references that should be checked by a specialist.

## Licence

MIT. See [`LICENSE`](LICENSE).
