'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';

export const OPENING_LINE = 'Before the gods, before Olympus, before time had a story — there was Chaos.';

/** Full-screen opening line shown when MYTHOS is first loaded at the home route. */
export default function OpeningSequence() {
  const [open, setOpen] = useState(true);
  const setIntroSeen = useStore((s) => s.setIntroSeen);
  const select = useStore((s) => s.select);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) btn.current?.focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;
  const enter = () => {
    setOpen(false);
    setIntroSeen();
    select({ kind: 'stage', id: 'primordial-origins' });
  };

  const words = OPENING_LINE.split(' ');
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="opening-line"
      className="starfield fixed inset-0 z-50 flex flex-col items-center justify-center bg-cosmos/95 px-6 text-center"
      onKeyDown={(e) => e.key === 'Escape' && enter()}
      data-testid="opening"
    >
      <p className="mb-6 text-xs uppercase tracking-[0.5em] text-mist">MYTHOS · an atlas of Greek myth</p>
      <h1 id="opening-line" className="font-display max-w-4xl text-4xl leading-tight text-marble sm:text-6xl">
        {words.map((w, i) => (
          <span key={i} className="animate-fade-up inline-block" style={{ animationDelay: `${0.15 * i}s` }}>
            {w}&nbsp;
          </span>
        ))}
      </h1>
      <p className="animate-fade-up mt-8 max-w-xl text-marble/75" style={{ animationDelay: '2.4s' }}>
        Myth keeps its own order. History keeps dates. Here they run on two separate clocks, joined only where a story is first recorded.
      </p>
      <button ref={btn} type="button" onClick={enter} className="btn animate-fade-up mt-10 px-6 py-2 text-base" style={{ animationDelay: '2.8s' }}>
        Enter the cosmos
      </button>
    </div>
  );
}
