/** The navigable modes, in display order. The first four are the mobile tab bar. */
export const MODES = [
  { href: '/timeline/', label: 'Timeline', short: 'Timeline', key: 'timeline', icon: '✦' },
  { href: '/tree/', label: 'Family Tree', short: 'Tree', key: 'tree', icon: '⌥' },
  { href: '/character/', label: 'Character', short: 'Figures', key: 'character', icon: '☉' },
  { href: '/map/', label: 'Map', short: 'Map', key: 'map', icon: '◎' },
  { href: '/relationship/', label: 'Relationship', short: 'Relationship', key: 'relationship', icon: '↔' },
  { href: '/learn/', label: 'Learning', short: 'Learning', key: 'learn', icon: '➔' },
  { href: '/compare/', label: 'Civilizations', short: 'Civilizations', key: 'compare', icon: '⊕', soon: true },
  { href: '/story/', label: 'Story', short: 'Story', key: 'story', icon: '❦', soon: true },
] as const;

export type Mode = (typeof MODES)[number];

export const isActiveMode = (pathname: string, href: string) => pathname === href || pathname === href.slice(0, -1) || (href === '/timeline/' && pathname === '/');
