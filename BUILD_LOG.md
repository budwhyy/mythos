# MYTHOS — Build Log (prototype v0.1)

Built 2026-10-14 by Claude Code from the MYTHOS build brief.

## Deployment record

| Item | Value |
|---|---|
| Live URL | https://mythos-atlas-898.netlify.app |
| Netlify site ID | `c904cdb2-6b1d-47d2-aa11-409f30836d35` |
| Netlify site name | `mythos-atlas-898` (`mythos-atlas` was already taken; Netlify assigned the nearest available name) |
| Repository | https://github.com/budwhyy/mythos (public, default branch `main`) |
| Continuous deployment | Enabled for `main` using Netlify's manual Git setup: a read-only deploy key on the repo, repo build settings on the site, and a GitHub webhook to `api.netlify.com/hooks/github`. The Netlify GitHub App was not installed, because that step needs browser interaction. Build command on Netlify: `npm test && npm run build`. |

## Verification at hand-off

- `npm run build`: data validation passes, and the static export builds all 9 routes.
- `npm test`: 35 Vitest tests pass. They cover the schema, the two-clock rules, data minimums, the graph, geo, and first-attestation logic.
- `npm run test:e2e`: 11 Playwright smoke tests pass (at least one per mode), run against `out/` in Chromium with reduced motion.
- Lighthouse 12 (Playwright Chromium, simulated mobile):
  - **Accessibility: 100 on all 8 pages** (target ≥ 90).
  - **Best practices: 96 before the favicon was added.** The only failure was the 404 for `/favicon.ico`, which is now fixed.
  - **Performance: 32–71**, varying a lot between identical runs on the build machine. Lighthouse throttles to a 4× slower CPU over slow 4G. Most of the blocking time is Next/React start-up plus three.js parsing on the 3D pages. 3D bundles are code-split and load only on pages that use them.
  - The "60 fps on midrange laptops" target was not measured with a profiler. The 3D scenes are small: about 100 meshes in the mythic sequence, and 62 nodes in the graph with labels cached as sprites.

## Decisions and assumptions

1. **Static export works**, so `output: 'export'` is used with no Netlify Next runtime. No feature needs SSR.
2. **TypeScript is pinned to 5.9.** npm resolved TypeScript 7, which Next 15's tooling does not support.
3. **Zod 3** (not 4), because the API is stable and well known. **Tailwind v4** via `@tailwindcss/postcss`.
4. **The globe uses MapLibre's globe projection, not R3F.** It is the same real-tile map as the flat view, so it shows the same classified places. R3F is used for the mythic sequence. (The brief listed R3F for "mythic sequence and globe".)
5. **Tiles are OpenFreeMap's `dark` style** (free, no key). If it fails to load, the map falls back to `demotiles.maplibre.org`. No API keys are committed.
6. **drei `<Html>` was replaced by a projected DOM label layer** in the 3D sequence. Under React 19, drei's per-label React roots produced "synchronously unmount a root" errors and DOM `removeChild` crashes. The replacement uses one DOM layer, positioned each frame from `useFrame`.
7. **Stricter than the brief on dates.** Mythic records may not contain absolute dates even in prose: "c. 700 BCE" in a god's summary fails the build. Dates appear only on historical records, and in bridges where they are labelled as the historical side.
8. **Production skips runtime Zod.** The build validates first, and a unit test guarantees the raw JSON needs no Zod defaults, so the browser does not re-parse the dataset. Dev and tests still validate on load.
9. **"First attested" is chosen in tiers:**
   - a figure's own record;
   - then records of events the figure takes part in;
   - then the stage;
   - only `first_attestation`, `literary_codification` and `cult_evidence` qualify.

   Syncretism, reception and archaeological context never count. The `archaeological_context` kind was added for the Troy/Hisarlik hinge.
10. **Generations** in the Family Tree are genealogical depth over the parent edges currently visible. Figures whose parents aren't in the dataset (e.g. Peleus, Priam, Circe) get a generation from their mythic stage. The tree loads generations 0–4 by default ("lazy-load branches"); deeper ones are added on Expand.
11. **One relationship was removed.** I removed my own draft edge "Chaos sibling of Gaia": Hesiod has both simply come to be, not as siblings. As a result, Chaos's line (Nyx, Erebus, Aether, Hemera) is not connected to Gaia's line. The path tracer explains this instead of inventing a link.
12. **Map placement rules:**
    - a `mythical` place gets a pin only when it has a sourced ancient identification, drawn as a hollow "proposed" ring (Aeaea → Monte Circeo, Hesperides → Euesperides);
    - otherwise it appears only on the symbolic cosmos map;
    - `debated` places are pinned at their leading proposal, with a confidence note;
    - Thrinacia's marker stands for Sicily as a whole.
13. **The era selector applies only to the Ancient Historical layer**, filtering by `Location.periods`. Mythical places have their own toggle.
14. **Periods overlap on purpose** (e.g. the Roman period, 509 BCE–330 CE, runs parallel to the Greek periods). Period boundaries are conventions.

## Mobile pass (2026-10-14, after first deploy)

The first deploy stacked the desktop header (266 px, sticky), a two-line "Where am I?" bar and a 60 dvh detail panel on phones, and put controls above content on Tree, Map and Character. Changes:

- Below `md` (768 px): a 52 px top bar (logo, search, menu), a five-tab bottom bar (Timeline, Tree, Figures, Map, More), and a "More" sheet with the remaining modes plus reading level, 2D/3D and history/bookmarks.
- "Where am I?" is a single tappable line that expands to the full two-clock reading.
- The detail panel is a bottom sheet with a drag handle: tap to toggle peek/full, drag down to dismiss. It sits above the tab bar.
- Tree, Map and Character show the graph, map or figure first; filters and options collapse behind a button; the character list becomes a grouped dropdown.
- The 3D camera pulls back on narrow screens so a whole constellation fits; the map shows the current journey leg as an overlay.
- Touch targets are at least 40 px on coarse pointers; safe-area insets are respected.
- Verification: a `mobile` Playwright project (Pixel 5) with six smoke tests; Lighthouse mobile accessibility 100 and best practices 100 on Timeline, Tree, Map, Character and Learning. No horizontal overflow at 375 px.
- 3D labels no longer overlap. Each frame, the label projector runs a collision pass: figure names take precedence, each label tries a ring of candidate offsets around its star and takes the first free slot, the stage title block is an obstacle, and a label with no free slot is hidden rather than stacked. On phones, event labels truncate with an ellipsis; in the densest stage (Olympian Age) all ten figure names show and about seven of nine event labels are hidden — their stars stay tappable. A Playwright test asserts zero overlapping labels in both projects.
- Fixed a data-loss bug found on the way: the persisted store was rehydrated in Shell's effect, but page effects run first and wrote default state over saved bookmarks and reading level on a direct visit to a page. Hydration now happens in a sibling mounted before Shell; a test covers it.
- Netlify's "Built with Netlify" badge was disabled through the API (`built_with_badge_enabled: false`); it had overlapped the bottom tab bar.

## Images pass (2026-10-16)

- 45 figure portraits from the Met Open Access API (CC0; search is on `v1.1`, objects still on `v1`, and bursts are rate-limited) and Wikimedia Commons categories (ancient-art categories first; the bare `Category:<Name>` is full of moons, butterflies and excavators and is used only through manual review). Every candidate was reviewed on contact sheets before being bundled.
- Portraits replace the dots in both the 3D graph (circular canvas-texture sprites with a type-coloured ring) and the 2D canvas, head the character panel and detail sheet with full credit, and thumbnail the character list. The 3D layout became layered 2.5D (generation fixes y, shallow deterministic z) because free-z clouds stack faces in projection.
- Schema: `ImageSchema` with `objectDate`; the `image` subtree is exempt from the mythic-date scan (evidence about the object), covered by a unit test.
- Not done: images for places and stages, and credit lines from Commons are sometimes terse ("Own work"); the link back is always present.

## Deploy blocked (2026-10-16)

The images commit (`ff6e5ca`) is on GitHub but **not live**: Netlify skipped the Git build with "account credit usage exceeded", and a CLI upload (`netlify deploy --prod --dir=out`) was refused with 403 Forbidden. The free plan's monthly allowance is used up (the earlier deploys and builds during the mobile pass consumed it). Nothing in the repo is wrong.

To resume once the account has credit again (monthly reset or a plan change in the Netlify dashboard → Team → Billing): push any commit to `main`, or run `npm run build && npx netlify deploy --prod --dir=out` from this folder (the site is linked via `.netlify/state.json`).

## Data-model gaps

- **No `nymph` or `deity` entity type.** The brief's enum is followed, so:
  - Maia is typed `mortal`;
  - Thetis, Calypso and Circe are typed `creature`;
  - Metis, Dione, Leto, Prometheus and Atlas are typed `titan` (Titan generation, not the canonical twelve);
  - Hades and Hestia are typed `olympian` as children of Cronus, although Hades does not live on Olympus.

  Each panel's text says so where it matters. **Recommendation:** add `nymph` and `deity` types.
- `Entity.type` includes `place`, but places are modelled as `Location` records, so no entity uses `place`.
- **Relationships are generated** from `scripts/build-relationships.mjs` into `data/relationships.json`. Edit the script, not the JSON.
- **Mixed-era dates.** Historical `dateRange` uses one `era` per record, so a range spanning BCE/CE would need two records. None currently does.

## Content: references to check

Citations were written from the compiler's knowledge of the texts, not checked against editions during this build. Line numbers for Hesiod follow West's numbering, and Homer is cited by book.line. **A classicist should verify these before public launch**, especially:

- Simonides fr. 575 PMG (Eros as child of Aphrodite and Ares);
- Diodorus 4.4.1 (the Orphic Dionysus, son of Persephone);
- Strabo 5.3.6 (Circeii as Aeaea) and the Euesperides identification of the Hesperides;
- Stesichorus' Palinode cited as fr. 192 PMG;
- the Proclus *Cypria* summary references (cited by episode, not section number);
- Statius, *Achilleid* line references for the heel;
- the Linear B tablet references (KN V 52, PY Tn 316, PY Xa 102). The readings themselves are well established; the tablet numbers should be confirmed;
- historical date ranges are conventional scholarly ranges and are flagged as approximate. Several are explicitly contested in the UI (Homer, the Knossos tablets, the first Olympiad).

## Not built in v0.1 (by design)

- **Civilization comparison and Story Mode** are navigable stubs that say "coming soon", with no placeholder content.
- There are no shareable deep-link URLs for selections. State is held in Zustand, with bookmarks and history in localStorage.
- There is no automated frame-rate test.

## Blockers encountered

- `netlify login` needed one browser authorization by the account owner. It was granted during the build.
- The site name `mythos-atlas` was unavailable, so `mythos-atlas-898` is used.
- No other blockers.
