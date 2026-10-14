'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { use2D } from '@/lib/hooks';
import Search from './Search';
import WhereAmI from './WhereAmI';
import DetailPanel from './DetailPanel';
import LibraryDrawer from './LibraryDrawer';

export const MODES = [
  { href: '/timeline/', label: 'Timeline', key: 'timeline' },
  { href: '/tree/', label: 'Family Tree', key: 'tree' },
  { href: '/character/', label: 'Character', key: 'character' },
  { href: '/map/', label: 'Map', key: 'map' },
  { href: '/relationship/', label: 'Relationship', key: 'relationship' },
  { href: '/learn/', label: 'Learning', key: 'learn' },
  { href: '/compare/', label: 'Civilizations', key: 'compare', soon: true },
  { href: '/story/', label: 'Story', key: 'story', soon: true },
] as const;

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const select = useStore((s) => s.select);
  const selection = useStore((s) => s.selection);
  const readingLevel = useStore((s) => s.readingLevel);
  const setReadingLevel = useStore((s) => s.setReadingLevel);
  const setPrefer2D = useStore((s) => s.setPrefer2D);
  const { use2D: twoD, mounted } = use2D();
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      } else if (e.key === 'Escape' && !typing) {
        if (libraryOpen) setLibraryOpen(false);
        else select(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [libraryOpen, select]);

  const isActive = (href: string) => pathname === href || pathname === href.slice(0, -1) || (href === '/timeline/' && pathname === '/');

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-1 focus:text-cosmos">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-cosmos/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <Link href="/" className="font-display text-2xl font-semibold tracking-[0.25em] text-gold" aria-label="MYTHOS home">
            MYTHOS
          </Link>
          <nav aria-label="Modes" className="order-3 w-full overflow-x-auto lg:order-none lg:w-auto">
            <ul className="flex gap-1 whitespace-nowrap">
              {MODES.map((m) => (
                <li key={m.key}>
                  <Link
                    href={m.href}
                    aria-current={isActive(m.href) ? 'page' : undefined}
                    className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      isActive(m.href) ? 'bg-gold/20 text-gold' : 'text-marble/85 hover:bg-cosmos-3 hover:text-marble'
                    }`}
                  >
                    {m.label}
                    {'soon' in m && m.soon ? <span className="ml-1 text-[10px] uppercase tracking-wide text-mist">soon</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Search />
            <label className="sr-only" htmlFor="reading-level">
              Reading level
            </label>
            <select
              id="reading-level"
              value={readingLevel}
              onChange={(e) => setReadingLevel(e.target.value as typeof readingLevel)}
              className="rounded-md border border-gold/30 bg-cosmos-3 px-2 py-1.5 text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="scholarly">Scholarly</option>
            </select>
            <button
              type="button"
              className="btn"
              aria-pressed={mounted ? twoD : undefined}
              onClick={() => setPrefer2D(!twoD)}
              title="Switch between 3D views and accessible 2D fallbacks"
            >
              {mounted ? (twoD ? '2D view' : '3D view') : 'View'}
            </button>
            <button type="button" className="btn" onClick={() => setLibraryOpen(true)} aria-haspopup="dialog">
              History &amp; bookmarks
            </button>
          </div>
        </div>
        <WhereAmI />
      </header>
      <div className="relative flex flex-1">
        <main id="main" className="min-w-0 flex-1" tabIndex={-1}>
          {children}
        </main>
        {selection ? <DetailPanel /> : null}
      </div>
      <LibraryDrawer open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  );
}
