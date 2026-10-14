'use client';

import Link from 'next/link';
import { MODES, isActiveMode } from '@/lib/modes';

const PRIMARY = MODES.slice(0, 4);
const SECONDARY = MODES.slice(4);

/** Mobile-only tab bar. Four primary modes plus "More", which opens the menu sheet for the rest. */
export default function BottomNav({ pathname, onMore }: { pathname: string; onMore: () => void }) {
  const moreActive = SECONDARY.some((m) => isActiveMode(pathname, m.href));
  return (
    <nav aria-label="Modes" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-gold/20 bg-cosmos/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {PRIMARY.map((m) => {
          const active = isActiveMode(pathname, m.href);
          return (
            <li key={m.key}>
              <Link
                href={m.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${active ? 'text-gold' : 'text-marble/75'}`}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {m.icon}
                </span>
                {m.short}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            aria-haspopup="dialog"
            className={`flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] ${moreActive ? 'text-gold' : 'text-marble/75'}`}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ⋯
            </span>
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}
