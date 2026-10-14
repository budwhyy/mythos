// Generates data/relationships.json from a compact table. Re-run after editing: node scripts/build-relationships.mjs
// Each row: [kind, from, to, source, ref, note?]. Parent edges run parent -> child.
import { writeFileSync } from 'node:fs';

const H = 'hesiod-theogony';
const IL = 'homer-iliad';
const OD = 'homer-odyssey';
const AP = 'apollodorus';

const titans = ['oceanus', 'coeus', 'crius', 'hyperion', 'iapetus', 'theia', 'rhea', 'themis', 'mnemosyne', 'phoebe', 'tethys', 'cronus'];
const cronids = ['hestia', 'demeter', 'hera', 'hades', 'poseidon', 'zeus'];

const rows = [
  // Primordial
  ['parent', 'chaos', 'erebus', H, '123'],
  ['parent', 'chaos', 'nyx', H, '123'],
  ['parent', 'erebus', 'aether', H, '124–125'],
  ['parent', 'nyx', 'aether', H, '124–125'],
  ['parent', 'erebus', 'hemera', H, '124–125'],
  ['parent', 'nyx', 'hemera', H, '124–125'],
  ['partner', 'erebus', 'nyx', H, '125'],
  ['parent', 'gaia', 'uranus', H, '126–128', 'Gaia bears Sky without a partner.'],
  ['parent', 'gaia', 'pontus', H, '131–132', 'Gaia bears Sea without a partner.'],
  ['partner', 'gaia', 'uranus', H, '133'],
  ['partner', 'gaia', 'tartarus', H, '821–822'],
  ['parent', 'gaia', 'typhon', H, '821–822'],
  ['parent', 'tartarus', 'typhon', H, '821–822'],
  ['sibling', 'chaos', 'gaia', H, '116–117', 'Both "come to be" first, with no parents.'],
  // Titans, Cyclopes, Hundred-Handers
  ...titans.flatMap((t) => [
    ['parent', 'gaia', t, H, '133–138'],
    ['parent', 'uranus', t, H, '133–138'],
  ]),
  ['parent', 'gaia', 'cyclopes', H, '139–146'],
  ['parent', 'uranus', 'cyclopes', H, '139–146'],
  ['parent', 'gaia', 'hekatoncheires', H, '147–153'],
  ['parent', 'uranus', 'hekatoncheires', H, '147–153'],
  ['conflict', 'uranus', 'hekatoncheires', H, '154–158', 'Uranus hides his children inside the earth.'],
  ['conflict', 'cronus', 'uranus', H, '154–182', 'Cronus castrates Uranus with Gaia’s sickle.'],
  ['alliance', 'gaia', 'cronus', H, '159–175', 'Gaia makes the sickle and sets the ambush.'],
  ['partner', 'oceanus', 'tethys', H, '337'],
  ['partner', 'hyperion', 'theia', H, '371–374'],
  ['partner', 'coeus', 'phoebe', H, '404'],
  ['partner', 'cronus', 'rhea', H, '453'],
  ['sibling', 'cronus', 'rhea', H, '133–138'],
  ['sibling', 'oceanus', 'tethys', H, '133–136'],
  ['parent', 'coeus', 'leto', H, '404–406'],
  ['parent', 'phoebe', 'leto', H, '404–406'],
  ['parent', 'oceanus', 'metis', H, '358'],
  ['parent', 'tethys', 'metis', H, '358'],
  ['parent', 'oceanus', 'dione', H, '353', 'Hesiod lists Dione among the Oceanids.'],
  ['parent', 'tethys', 'dione', H, '353', 'Hesiod lists Dione among the Oceanids.'],
  ['parent', 'gaia', 'dione', AP, '1.1.3', 'Apollodorus counts Dione among the Titans, children of Gaia and Uranus.'],
  ['parent', 'uranus', 'dione', AP, '1.1.3', 'Apollodorus counts Dione among the Titans, children of Gaia and Uranus.'],
  ['parent', 'iapetus', 'prometheus', H, '507–511'],
  ['parent', 'iapetus', 'atlas', H, '507–509'],
  ['sibling', 'prometheus', 'atlas', H, '507–511'],
  ['parent', 'atlas', 'maia', H, '938'],
  ['parent', 'atlas', 'calypso', OD, '1.52; 7.245'],
  // Children of Cronus and Rhea
  ...cronids.flatMap((c) => [
    ['parent', 'cronus', c, H, '453–458'],
    ['parent', 'rhea', c, H, '453–458'],
  ]),
  ['sibling', 'zeus', 'poseidon', IL, '15.187–193', 'The three brothers divide the world by lot.'],
  ['sibling', 'zeus', 'hades', IL, '15.187–193', 'The three brothers divide the world by lot.'],
  ['sibling', 'poseidon', 'hades', IL, '15.187–193'],
  ['sibling', 'zeus', 'hera', H, '453–458'],
  ['sibling', 'zeus', 'demeter', H, '453–458'],
  ['sibling', 'hestia', 'hera', H, '453–458'],
  ['conflict', 'cronus', 'zeus', H, '459–506, 617–735', 'Cronus swallows his children; Zeus overthrows him.'],
  ['alliance', 'rhea', 'zeus', H, '467–491', 'Rhea hides the infant Zeus and gives Cronus a stone.'],
  ['alliance', 'cyclopes', 'zeus', H, '501–506', 'Freed by Zeus, they give him thunder and lightning.'],
  ['alliance', 'hekatoncheires', 'zeus', H, '617–735', 'Released by Zeus, they decide the Titanomachy.'],
  ['conflict', 'zeus', 'typhon', H, '820–868'],
  ['conflict', 'zeus', 'prometheus', H, '521–616', 'The trick at Mecone and the theft of fire.'],
  ['alliance', 'prometheus', 'zeus', 'aeschylus-pv', '199–224', 'In Prometheus Bound, Prometheus sides with Zeus during the Titanomachy — a later dramatic version.'],
  ['conflict', 'zeus', 'atlas', H, '517–520', 'Zeus sentences Atlas to hold up the sky.'],
  ['alliance', 'thetis', 'zeus', IL, '1.396–406', 'Thetis summons Briareus to save Zeus from a revolt.'],
  // Zeus' partners and children
  ['partner', 'zeus', 'metis', H, '886–890'],
  ['partner', 'zeus', 'themis', H, '901'],
  ['partner', 'zeus', 'demeter', H, '912'],
  ['partner', 'zeus', 'mnemosyne', H, '915'],
  ['partner', 'zeus', 'leto', H, '918'],
  ['partner', 'zeus', 'hera', H, '921'],
  ['partner', 'zeus', 'maia', H, '938'],
  ['partner', 'zeus', 'semele', H, '940'],
  ['partner', 'zeus', 'alcmene', H, '943'],
  ['partner', 'zeus', 'dione', IL, '5.370–372'],
  ['parent', 'zeus', 'athena', H, '886–900, 924', 'Born from Zeus’ head after he swallowed the pregnant Metis.'],
  ['parent', 'metis', 'athena', H, '886–900', 'Hesiod: Metis is Athena’s mother.'],
  ['parent', 'zeus', 'athena', IL, '5.875–880', 'Ares complains that Zeus begot Athena himself — no mother named.'],
  ['parent', 'zeus', 'apollo', H, '918–920'],
  ['parent', 'leto', 'apollo', H, '918–920'],
  ['parent', 'zeus', 'artemis', H, '918–920'],
  ['parent', 'leto', 'artemis', H, '918–920'],
  ['sibling', 'apollo', 'artemis', 'hh-apollo', '14–18'],
  ['parent', 'zeus', 'ares', H, '921–923'],
  ['parent', 'hera', 'ares', H, '921–923'],
  ['parent', 'hera', 'hephaestus', H, '927–929', 'Hesiod: Hera bears Hephaestus alone, in anger at Zeus.'],
  ['parent', 'hera', 'hephaestus', IL, '1.577–579', 'Homer: Hephaestus calls Hera his mother and Zeus his father.'],
  ['parent', 'zeus', 'hephaestus', IL, '1.577–579', 'Homer: Zeus is Hephaestus’ father.'],
  ['parent', 'zeus', 'hephaestus', OD, '8.312', 'Hephaestus blames "my parents" for his lameness.'],
  ['parent', 'hera', 'hephaestus', OD, '8.312'],
  ['parent', 'zeus', 'hermes', H, '938–939'],
  ['parent', 'maia', 'hermes', H, '938–939'],
  ['parent', 'zeus', 'hermes', 'hh-hermes', '1–19'],
  ['parent', 'maia', 'hermes', 'hh-hermes', '1–19'],
  ['parent', 'zeus', 'dionysus', H, '940–942'],
  ['parent', 'semele', 'dionysus', H, '940–942'],
  ['parent', 'zeus', 'dionysus', 'diodorus', '4.4.1', 'An older Dionysus, son of Zeus and Persephone (the Orphic tradition reported by Diodorus).'],
  ['parent', 'persephone', 'dionysus', 'diodorus', '4.4.1', 'Orphic tradition reported by Diodorus.'],
  ['parent', 'zeus', 'persephone', H, '912–913'],
  ['parent', 'demeter', 'persephone', H, '912–913'],
  ['parent', 'zeus', 'heracles', H, '943–944'],
  ['parent', 'alcmene', 'heracles', H, '943–944'],
  ['parent', 'zeus', 'helen', IL, '3.418', 'Homer calls Helen daughter of Zeus.'],
  // Aphrodite: the classic conflict
  ['parent', 'uranus', 'aphrodite', H, '188–206', 'Hesiod: Aphrodite rises from the foam around Uranus’ severed genitals.'],
  ['parent', 'zeus', 'aphrodite', IL, '5.370–372', 'Homer: Aphrodite is the daughter of Zeus and Dione.'],
  ['parent', 'dione', 'aphrodite', IL, '5.370–372', 'Homer: Dione is Aphrodite’s mother.'],
  // Eros: primordial vs child of Aphrodite
  ['parent', 'aphrodite', 'eros', 'simonides-575', '575', 'A later tradition: Eros as child of Aphrodite and Ares. Hesiod makes Eros primordial.'],
  ['parent', 'ares', 'eros', 'simonides-575', '575'],
  ['partner', 'hephaestus', 'aphrodite', OD, '8.266–270', 'In the Iliad (18.382–383) his wife is Charis instead.'],
  ['partner', 'ares', 'aphrodite', OD, '8.266–366', 'The adultery exposed by Hephaestus’ net.'],
  ['partner', 'ares', 'aphrodite', H, '933–937', 'Hesiod: Aphrodite bears Ares Fear, Terror and Harmonia.'],
  ['conflict', 'hephaestus', 'ares', OD, '8.266–366'],
  ['partner', 'hades', 'persephone', 'hh-demeter', '1–39'],
  ['conflict', 'demeter', 'hades', 'hh-demeter', '305–413', 'Demeter withholds the harvest until Persephone is returned.'],
  ['conflict', 'athena', 'poseidon', AP, '3.14.1', 'Their contest for Athens.'],
  ['conflict', 'athena', 'ares', IL, '21.391–414'],
  ['conflict', 'hera', 'heracles', IL, '19.95–133', 'Hera delays his birth so Eurystheus rules.'],
  ['alliance', 'athena', 'heracles', IL, '8.362–369'],
  ['conflict', 'hermes', 'apollo', 'hh-hermes', '68–396', 'The theft of Apollo’s cattle.'],
  ['alliance', 'hermes', 'apollo', 'hh-hermes', '418–512', 'Reconciled by the gift of the lyre.'],
  ['conflict', 'apollo', 'achilles', IL, '22.7–20; 22.359–360'],
  // Heroic generation
  ['partner', 'peleus', 'thetis', IL, '18.432–434'],
  ['parent', 'peleus', 'achilles', IL, '1.1; 18.84–87'],
  ['parent', 'thetis', 'achilles', IL, '1.348–359'],
  ['parent', 'priam', 'paris', IL, '3.15–75; 6.280–285'],
  ['partner', 'paris', 'helen', IL, '3.441–448'],
  ['alliance', 'aphrodite', 'paris', IL, '3.373–382', 'Aphrodite snatches Paris from his duel with Menelaus.'],
  ['conflict', 'achilles', 'agamemnon', IL, '1.101–303'],
  ['alliance', 'hermes', 'priam', IL, '24.334–467', 'Hermes guides Priam to Achilles’ hut.'],
  ['alliance', 'hera', 'jason', OD, '12.72', 'The Argo passes the Clashing Rocks "because Jason was dear to Hera".'],
  ['alliance', 'peleus', 'jason', 'apollonius', '1.94', 'Peleus sails among the Argonauts.'],
  ['partner', 'odysseus', 'penelope', OD, '23.173–230'],
  ['partner', 'odysseus', 'calypso', OD, '5.151–227'],
  ['partner', 'odysseus', 'circe', OD, '10.333–347'],
  ['alliance', 'athena', 'odysseus', OD, '1.44–95; 13.287–440'],
  ['alliance', 'hermes', 'odysseus', OD, '10.275–308', 'Hermes gives Odysseus the herb moly.'],
  ['conflict', 'poseidon', 'odysseus', OD, '1.68–75'],
  ['conflict', 'odysseus', 'polyphemus', OD, '9.105–566'],
  ['parent', 'poseidon', 'polyphemus', OD, '1.68–73'],
  ['alliance', 'odysseus', 'agamemnon', IL, '9.169–181', 'Odysseus serves on Agamemnon’s embassy to Achilles.'],
];

const seen = new Map();
const out = rows.map(([kind, from, to, source, ref, note]) => {
  const base = `${kind}-${from}-${to}-${source}`.replace(/[^a-z0-9-]/g, '');
  const n = (seen.get(base) ?? 0) + 1;
  seen.set(base, n);
  const rel = { id: n > 1 ? `${base}-${n}` : base, from, to, kind, source, ref };
  if (note) rel.note = note;
  return rel;
});

writeFileSync(new URL('../data/relationships.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${out.length} relationships`);
