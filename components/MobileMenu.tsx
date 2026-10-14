'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MODES, isActiveMode } from '@/lib/modes';

type Props = { open: boolean; onClose: () => void; pathname: string; onLibrary: () => void; children: React.ReactNode };

/** Mobile sheet with every mode plus settings. Rendered only below `md`. */
export default function MobileMenu({ open, onClose, pathname, onLibrary, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>('a, button, select')?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/60 md:hidden" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="panel safe-bottom max-h-[85dvh] w-full overflow-auto rounded-b-none p-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl text-gold">Explore</h2>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {MODES.map((m) => {
            const active = isActiveMode(pathname, m.href);
            return (
              <li key={m.key}>
                <Link
                  href={m.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${active ? 'border-gold bg-gold/15 text-gold' : 'border-gold/25 bg-cosmos-3 text-marble'}`}
                >
                  <span aria-hidden="true">{m.icon}</span>
                  {m.label}
                  {'soon' in m && m.soon ? <span className="ml-auto text-[10px] uppercase tracking-wide text-mist">soon</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
        <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-mist">Settings</h3>
        {children}
        <button type="button" className="btn mt-3 w-full justify-center" onClick={onLibrary} aria-haspopup="dialog">
          History &amp; bookmarks
        </button>
      </div>
    </div>
  );
}
