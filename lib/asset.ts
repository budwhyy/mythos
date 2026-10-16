/**
 * Prefix for deployments under a sub-path (GitHub Pages project sites serve at /<repo>/).
 * Empty at a domain root (Netlify, local). Next prefixes <Link>, scripts and metadata icons itself,
 * but not plain <img src>, canvas/texture loads or other hand-built URLs — those go through withBase.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const withBase = (path: string): string => (path.startsWith('/') ? BASE_PATH + path : path);
