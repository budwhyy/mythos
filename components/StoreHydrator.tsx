'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * Rehydrates the persisted store. Mounted as the first child of <body>, before <Shell>, so its effect
 * runs before any page effect can write defaults over the saved state (React runs effects child-first,
 * earlier siblings before later ones).
 */
export default function StoreHydrator() {
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);
  return null;
}
