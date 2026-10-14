'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useStore } from './store';

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

let webglCache: boolean | null = null;
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement('canvas');
    webglCache = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/** True once mounted on the client (persisted store + browser APIs are safe to read). */
export function useMounted(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/**
 * Whether to render the 2D fallback instead of a 3D view.
 * Explicit user preference wins; otherwise 2D when WebGL is missing or reduced motion is requested.
 */
export function use2D(): { use2D: boolean; reason: string | null; mounted: boolean } {
  const pref = useStore((s) => s.prefer2D);
  const reduced = useReducedMotion();
  const mounted = useMounted();
  if (!mounted) return { use2D: true, reason: null, mounted };
  if (!hasWebGL()) return { use2D: true, reason: 'WebGL is unavailable in this browser, so the 2D view is shown.', mounted };
  if (pref !== null) return { use2D: pref, reason: null, mounted };
  if (reduced) return { use2D: true, reason: 'Reduced motion is on, so the 2D view is shown. You can switch to 3D.', mounted };
  return { use2D: false, reason: null, mounted };
}
