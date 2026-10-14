'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Selection } from './data';

export type Mode = 'timeline' | 'tree' | 'character' | 'map' | 'relationship' | 'learn' | 'compare' | 'story';
export type ReadingLevel = 'beginner' | 'intermediate' | 'scholarly';
export type Frame = 'mythic' | 'historical' | 'attestation';

type State = {
  frame: Frame;
  selection: Selection | null;
  /** The mythic stage the cinematic sequence is currently showing (ordinal id, never a date). */
  stageFocus: string | null;
  history: Selection[];
  bookmarks: Selection[];
  readingLevel: ReadingLevel;
  /** User preference for 2D views; null = automatic (2D when reduced motion or no WebGL). */
  prefer2D: boolean | null;
  introSeen: boolean;
  learnStep: number;
  select: (sel: Selection | null) => void;
  /** Return to the previously visited item. */
  back: () => void;
  setFrame: (f: Frame) => void;
  setStageFocus: (id: string | null) => void;
  toggleBookmark: (sel: Selection) => void;
  clearHistory: () => void;
  setReadingLevel: (l: ReadingLevel) => void;
  setPrefer2D: (v: boolean | null) => void;
  setIntroSeen: () => void;
  setLearnStep: (n: number) => void;
};

const same = (a: Selection, b: Selection) => a.kind === b.kind && a.id === b.id;

const frameFor = (sel: Selection): Frame =>
  sel.kind === 'historicalEvent' ? 'historical' : sel.kind === 'attestation' ? 'attestation' : sel.kind === 'location' ? 'historical' : 'mythic';

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      frame: 'mythic',
      selection: null,
      stageFocus: null,
      history: [],
      bookmarks: [],
      readingLevel: 'beginner',
      prefer2D: null,
      introSeen: false,
      learnStep: 0,
      select: (sel) => {
        if (!sel) return set({ selection: null });
        const history = [sel, ...get().history.filter((h) => !same(h, sel))].slice(0, 40);
        set({ selection: sel, history, frame: frameFor(sel) });
      },
      back: () => {
        const [, prev, ...rest] = get().history;
        if (!prev) return;
        set({ selection: prev, history: [prev, ...rest], frame: frameFor(prev) });
      },
      setFrame: (frame) => set({ frame }),
      setStageFocus: (stageFocus) => set({ stageFocus }),
      toggleBookmark: (sel) => {
        const b = get().bookmarks;
        set({ bookmarks: b.some((x) => same(x, sel)) ? b.filter((x) => !same(x, sel)) : [sel, ...b] });
      },
      clearHistory: () => set({ history: [] }),
      setReadingLevel: (readingLevel) => set({ readingLevel }),
      setPrefer2D: (prefer2D) => set({ prefer2D }),
      setIntroSeen: () => set({ introSeen: true }),
      setLearnStep: (learnStep) => set({ learnStep }),
    }),
    {
      name: 'mythos-v1',
      skipHydration: true, // rehydrated in Shell after mount to avoid SSR mismatches
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        bookmarks: s.bookmarks,
        history: s.history,
        readingLevel: s.readingLevel,
        prefer2D: s.prefer2D,
        introSeen: s.introSeen,
        learnStep: s.learnStep,
      }),
    },
  ),
);

export const isBookmarked = (bookmarks: Selection[], sel: Selection | null) => !!sel && bookmarks.some((b) => same(b, sel));
