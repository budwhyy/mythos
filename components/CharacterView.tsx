'use client';

import { useEffect } from 'react';
import { data } from '@/lib/data';
import { useStore } from '@/lib/store';
import CharacterPanel from './CharacterPanel';

const GROUPS = [
  ['primordial', 'Primordials'],
  ['titan', 'Titans & their kin'],
  ['olympian', 'Olympians'],
  ['hero', 'Heroes'],
  ['mortal', 'Mortals & nymphs'],
  ['creature', 'Creatures & sea-powers'],
] as const;

export default function CharacterView() {
  const selection = useStore((s) => s.selection);
  const select = useStore((s) => s.select);
  const id = selection?.kind === 'entity' ? selection.id : null;

  useEffect(() => {
    if (!id) select({ kind: 'entity', id: 'zeus' });
  }, [id, select]);

  return (
    <div className="flex flex-col gap-3 p-3 md:flex-row md:gap-4 md:p-4">
      <div className="panel p-3 md:hidden">
        <label htmlFor="figure-select" className="font-display block text-2xl text-gold">
          Characters
        </label>
        <select
          id="figure-select"
          value={id ?? ''}
          onChange={(e) => select({ kind: 'entity', id: e.target.value })}
          className="mt-1 w-full rounded-md border border-gold/30 bg-cosmos-3 px-2 py-2 text-base"
        >
          {GROUPS.map(([type, label]) => {
            const list = data.entities.filter((e) => e.type === type).sort((a, b) => a.name.localeCompare(b.name));
            return list.length ? (
              <optgroup key={type} label={label}>
                {list.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </optgroup>
            ) : null;
          })}
        </select>
      </div>
      <nav aria-label="Figures" className="panel hidden max-h-[80dvh] overflow-auto p-3 md:block md:w-64 md:shrink-0">
        <h1 className="font-display mb-2 text-3xl text-gold">Characters</h1>
        {GROUPS.map(([type, label]) => {
          const list = data.entities.filter((e) => e.type === type).sort((a, b) => a.name.localeCompare(b.name));
          if (!list.length) return null;
          return (
            <section key={type} className="mb-3">
              <h2 className="text-xs uppercase tracking-wide text-mist">{label}</h2>
              <ul>
                {list.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      aria-current={id === e.id ? 'true' : undefined}
                      onClick={() => select({ kind: 'entity', id: e.id })}
                      className={`w-full rounded px-2 py-0.5 text-left text-sm ${id === e.id ? 'bg-gold/20 text-gold' : 'hover:bg-cosmos-3'}`}
                    >
                      {e.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </nav>
      <div className="panel min-w-0 flex-1 p-4 md:p-5" data-testid="character-panel">
        {id ? <CharacterPanel id={id} /> : null}
      </div>
    </div>
  );
}
