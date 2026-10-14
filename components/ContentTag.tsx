/** Labels what kind of knowledge a block of text represents (content standard §6). */
const TAGS = {
  myth: { label: 'Myth · retelling of ancient sources', cls: 'text-mythic' },
  literary: { label: 'Ancient literary source', cls: 'text-marble' },
  archaeology: { label: 'Archaeology', cls: 'text-verified' },
  epigraphy: { label: 'Inscriptions / tablets', cls: 'text-verified' },
  scholarship: { label: 'Modern scholarship & theory', cls: 'text-gold' },
} as const;

export type ContentKind = keyof typeof TAGS;

export function ContentTag({ kind }: { kind: ContentKind }) {
  const t = TAGS[kind];
  return <span className={`chip ${t.cls}`}>{t.label}</span>;
}

export const evidenceToContent = (e: 'archaeological' | 'epigraphic' | 'literary'): ContentKind =>
  e === 'archaeological' ? 'archaeology' : e === 'epigraphic' ? 'epigraphy' : 'literary';
