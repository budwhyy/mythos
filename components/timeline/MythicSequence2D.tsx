'use client';

import { useEffect, useRef } from 'react';
import { data, stagesOrdered } from '@/lib/data';
import { useStore } from '@/lib/store';

/** Accessible 2D fallback: an ordered row of stage cards. No dates, no scale. */
export default function MythicSequence2D() {
  const stageFocus = useStore((s) => s.stageFocus);
  const select = useStore((s) => s.select);
  const setStageFocus = useStore((s) => s.setStageFocus);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!stageFocus) return;
    listRef.current?.querySelector(`[data-stage="${stageFocus}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [stageFocus]);

  return (
    <ol ref={listRef} className="flex h-full snap-x gap-3 overflow-x-auto p-4" aria-label="Mythic sequence, in order">
      {stagesOrdered.map((s, i) => {
        const focused = stageFocus === s.id;
        const events = data.mythicEvents.filter((m) => m.stage === s.id);
        return (
          <li key={s.id} data-stage={s.id} className="flex snap-center items-stretch">
            <div className={`panel flex w-64 shrink-0 flex-col p-3 ${focused ? 'ring-2 ring-gold' : ''}`}>
              <button
                type="button"
                className="text-left"
                onClick={() => {
                  setStageFocus(s.id);
                  select({ kind: 'stage', id: s.id });
                }}
                aria-pressed={focused}
              >
                <span className="text-[10px] uppercase tracking-widest text-mythic">Stage {i + 1}</span>
                <span className="font-display block text-2xl leading-tight text-gold">{s.name}</span>
                <span className="font-display block text-sm italic text-marble/80">{s.tagline}</span>
              </button>
              <ul className="mt-2 space-y-0.5 text-xs">
                {events.map((m) => (
                  <li key={m.id}>
                    <button type="button" className="text-left text-marble/85 hover:text-gold hover:underline" onClick={() => select({ kind: 'mythicEvent', id: m.id })}>
                      ✦ {m.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {i < stagesOrdered.length - 1 ? (
              <span aria-hidden="true" className="self-center px-1 text-mythic">
                →
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
