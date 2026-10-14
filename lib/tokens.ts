/** MYTHOS design tokens. Mirrored as CSS variables in app/globals.css (@theme). */
export const tokens = {
  color: {
    gold: '#C9A227',
    bronze: '#8C6A3F',
    marble: '#E8E4DC',
    cosmos: '#070912',
    cosmos2: '#0E1222',
    cosmos3: '#161B30',
    mist: '#A9A6B8',
    // relationship edge colours
    parent: '#C9A227',
    partner: '#E58FB0',
    sibling: '#7FB3E6',
    conflict: '#E2563B',
    alliance: '#6CC48F',
    // classification colours
    verified: '#6CC48F',
    traditionally_identified: '#C9A227',
    debated: '#E0913A',
    mythical: '#A78BFA',
    // frames
    mythic: '#A78BFA',
    historical: '#C9A227',
    attestation: '#E8E4DC',
  },
  font: { display: 'var(--font-display)', ui: 'var(--font-ui)' },
} as const;

export const edgeColor = (kind: string) => (tokens.color as Record<string, string>)[kind] ?? tokens.color.mist;
