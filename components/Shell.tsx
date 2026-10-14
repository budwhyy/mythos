'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { use2D, useIsMobile } from '@/lib/hooks';
import Search from './Search';
import WhereAmI from './WhereAmI';
import DetailPanel from './DetailPanel';
import LibraryDrawer from './LibraryDrawer';
import BottomNav from './BottomNav';
import MobileMenu from './MobileMenu';
import { MODES, isActiveMode } from '@/lib/modes';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const select = useStore((s) => s.select);
  const selection = useStore((s) => s.selection);
  const readingLevel = useStore((s) => s.readingLevel);
  const setReadingLevel = useStore((s) => s.setReadingLevel);
  const setPrefer2D = useStore((s) => s.setPrefer2D);
  const { use2D: twoD, mounted } = use2D();
  const isMobile = useIsMobile();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close transient UI on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        if (isMobile) setSearchOpen(true);
        // The mobile search row mounts on the next frame.
        requestAnimationFrame(() => document.getElementById('global-search')?.focus());
      } else if (e.key === 'Escape' && !typing) {
        if (menuOpen) setMenuOpen(false);
        else if (libraryOpen) setLibraryOpen(false);
        else if (searchOpen) setSearchOpen(false);
        else select(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [libraryOpen, menuOpen, searchOpen, select, isMobile]);

  const showDetail = selection && !(selection.kind === 'entity' && pathname.startsWith('/character'));

  const viewToggle = (
    <button
      type="button"
      className="btn"
      aria-pressed={mounted ? twoD : undefined}
      onClick={() => setPrefer2D(!twoD)}
      title="Switch between 3D views and accessible 2D fallbacks"
    >
      {mounted ? (twoD ? '2D view' : '3D view') : 'View'}
    </button>
  );
  const levelSelect = (id: string) => (
    <>
      <label className="sr-only" htmlFor={id}>
        Reading level
      </label>
      <select
        id={id}
        value={readingLevel}
        onChange={(e) => setReadingLevel(e.target.value as typeof readingLevel)}
        className="rounded-md border border-gold/30 bg-cosmos-3 px-2 py-1.5 text-sm"
      >
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="scholarly">Scholarly</option>
      </select>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-1 focus:text-cosmos">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-cosmos/95 backdrop-blur">
        {/* Mobile top bar: logo, search, menu. Modes live in the bottom nav. */}
        <div className="flex items-center gap-2 px-3 py-1.5 md:hidden">
          <Link href="/" className="font-display text-xl font-semibold tracking-[0.25em] text-gold" aria-label="MYTHOS home">
            MYTHOS
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="btn px-3"
              aria-label={searchOpen ? 'Close search' : 'Search'}
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((o) => !o);
                if (!searchOpen) requestAnimationFrame(() => document.getElementById('global-search')?.focus());
              }}
            >
              {searchOpen ? '✕' : '⌕'}
            </button>
            <button type="button" className="btn px-3" aria-label="Menu and settings" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              ☰
            </button>
          </div>
        </div>
        {isMobile && searchOpen ? (
          <div className="px-3 pb-2 md:hidden">
            <Search fullWidth />
          </div>
        ) : null}

        {/* Desktop header */}
        <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:flex">
          <Link href="/" className="font-display text-2xl font-semibold tracking-[0.25em] text-gold" aria-label="MYTHOS home">
            MYTHOS
          </Link>
          <nav aria-label="Modes" className="order-3 w-full overflow-x-auto lg:order-none lg:w-auto">
            <ul className="flex gap-1 whitespace-nowrap">
              {MODES.map((m) => (
                <li key={m.key}>
                  <Link
                    href={m.href}
                    aria-current={isActiveMode(pathname, m.href) ? 'page' : undefined}
                    className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      isActiveMode(pathname, m.href) ? 'bg-gold/20 text-gold' : 'text-marble/85 hover:bg-cosmos-3 hover:text-marble'
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
            {levelSelect('reading-level')}
            {viewToggle}
            <button type="button" className="btn" onClick={() => setLibraryOpen(true)} aria-haspopup="dialog">
              History &amp; bookmarks
            </button>
          </div>
        </div>
        <WhereAmI compact={isMobile} />
      </header>

      <div className="relative flex flex-1">
        <main id="main" className="min-w-0 flex-1 pb-20 md:pb-0" tabIndex={-1}>
          {children}
        </main>
        {showDetail ? <DetailPanel mobile={isMobile} /> : null}
      </div>

      <BottomNav pathname={pathname} onMore={() => setMenuOpen(true)} />
      <MobileMenu
        open={isMobile && menuOpen}
        onClose={() => setMenuOpen(false)}
        pathname={pathname}
        onLibrary={() => {
          setMenuOpen(false);
          setLibraryOpen(true);
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {levelSelect('reading-level-mobile')}
          {viewToggle}
        </div>
      </MobileMenu>
      <LibraryDrawer open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  );
}
