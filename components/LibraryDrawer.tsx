'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { labelOf, type Selection } from '@/lib/data';
import { useMounted } from '@/lib/hooks';

const kindLabel: Record<string, string> = {
  entity: 'figure',
  stage: 'mythic stage',
  mythicEvent: 'mythic event',
  historicalEvent: 'historical',
  attestation: 'bridge',
  location: 'place',
};

function List({ items, empty, onPick }: { items: Selection[]; empty: string; onPick: (s: Selection) => void }) {
  if (!items.length) return <p className="text-sm text-mist">{empty}</p>;
  return (
    <ul className="space-y-1">
      {items.map((s) => (
        <li key={s.kind + s.id}>
          <button type="button" className="w-full rounded px-2 py-1 text-left text-sm hover:bg-cosmos-3" onClick={() => onPick(s)}>
            {labelOf(s)} <span className="text-xs text-mist">{kindLabel[s.kind]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function LibraryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const history = useStore((s) => s.history);
  const bookmarks = useStore((s) => s.bookmarks);
  const select = useStore((s) => s.select);
  const clearHistory = useStore((s) => s.clearHistory);
  const mounted = useMounted();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>('button')?.focus();
  }, [open]);

  if (!open || !mounted) return null;
  const pick = (s: Selection) => {
    select(s);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="History and bookmarks"
        className="panel m-2 flex w-80 max-w-full flex-col gap-4 overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-gold">Your path</h2>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        <section>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist">Bookmarks</h3>
          <List items={bookmarks} empty="No bookmarks yet — use ☆ on any detail panel." onPick={pick} />
        </section>
        <section>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-mist">Recently visited</h3>
            {history.length ? (
              <button type="button" className="text-xs text-mist underline" onClick={clearHistory}>
                clear
              </button>
            ) : null}
          </div>
          <List items={history} empty="Nothing visited yet." onPick={pick} />
        </section>
      </div>
    </div>
  );
}
