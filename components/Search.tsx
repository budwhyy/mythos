'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { data, type Selection } from '@/lib/data';
import { useStore } from '@/lib/store';

type Item = { sel: Selection; label: string; hint: string; haystack: string; href: string };

const ITEMS: Item[] = [
  ...data.entities.map((e) => ({
    sel: { kind: 'entity' as const, id: e.id },
    label: e.name,
    hint: `${e.type}${e.greek ? ' · ' + e.greek : ''}`,
    haystack: [e.name, e.greek, ...(e.titles ?? []), ...(e.domains ?? [])].join(' ').toLowerCase(),
    href: '/character/',
  })),
  ...data.stages.map((s) => ({ sel: { kind: 'stage' as const, id: s.id }, label: s.name, hint: 'mythic stage', haystack: s.name.toLowerCase(), href: '/timeline/' })),
  ...data.mythicEvents.map((m) => ({ sel: { kind: 'mythicEvent' as const, id: m.id }, label: m.name, hint: 'mythic event', haystack: m.name.toLowerCase(), href: '/timeline/' })),
  ...data.historicalEvents.map((h) => ({
    sel: { kind: 'historicalEvent' as const, id: h.id },
    label: h.name,
    hint: 'historical evidence',
    haystack: h.name.toLowerCase(),
    href: '/timeline/',
  })),
  ...data.locations.map((l) => ({
    sel: { kind: 'location' as const, id: l.id },
    label: l.ancientName,
    hint: `place · ${l.modernName}`,
    haystack: `${l.ancientName} ${l.modernName} ${l.greek ?? ''}`.toLowerCase(),
    href: '/map/',
  })),
];

export default function Search() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const select = useStore((s) => s.select);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return ITEMS.filter((i) => i.haystack.includes(t))
      .sort((a, b) => Number(!a.label.toLowerCase().startsWith(t)) - Number(!b.label.toLowerCase().startsWith(t)))
      .slice(0, 10);
  }, [q]);

  const choose = (i: Item) => {
    select(i.sel);
    setQ('');
    setOpen(false);
    if (i.sel.kind === 'location') router.push(i.href);
  };

  return (
    <div className="relative">
      <label htmlFor="global-search" className="sr-only">
        Search gods, heroes, events and places
      </label>
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="search-results"
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `sr-${active}` : undefined}
        placeholder="Search  ( / )"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter' && results[active]) {
            choose(results[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        className="w-44 rounded-md border border-gold/30 bg-cosmos-3 px-3 py-1.5 text-sm placeholder:text-mist sm:w-56"
      />
      {open && results.length > 0 ? (
        <ul id="search-results" role="listbox" className="panel absolute right-0 z-40 mt-1 max-h-80 w-72 overflow-auto p-1 shadow-xl">
          {results.map((r, i) => (
            <li
              key={r.sel.kind + r.sel.id}
              id={`sr-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(r);
              }}
              className={`cursor-pointer rounded px-2 py-1.5 text-sm ${i === active ? 'bg-gold/20' : ''}`}
            >
              <span className="text-marble">{r.label}</span> <span className="text-xs text-mist">{r.hint}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
