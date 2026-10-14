'use client';

import { data } from '@/lib/data';
import { useStore } from '@/lib/store';
import { tokens } from '@/lib/tokens';

/**
 * A stylised picture of the Homeric/Hesiodic cosmos — NOT a map of Earth.
 * Mythical places sit at symbolic positions: west at the far left, Olympus above, Tartarus below.
 */
export default function SymbolicMap({ activeId }: { activeId?: string | null }) {
  const select = useStore((s) => s.select);
  const selection = useStore((s) => s.selection);
  const mythical = data.locations.filter((l) => l.classification === 'mythical' && l.symbolic);
  const W = 400;
  const H = 300;
  const px = (x: number) => (x / 100) * W;
  const py = (y: number) => (y / 100) * H;

  return (
    <figure className="panel p-2" aria-labelledby="symbolic-caption">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="group" aria-label="Symbolic map of the mythic cosmos">
        <defs>
          <radialGradient id="earthdisc">
            <stop offset="0" stopColor={tokens.color.bronze} stopOpacity="0.35" />
            <stop offset="1" stopColor={tokens.color.bronze} stopOpacity="0.05" />
          </radialGradient>
        </defs>
        {/* sky dome */}
        <path d={`M 30 ${py(52)} Q ${W / 2} -40 ${W - 30} ${py(52)}`} fill="none" stroke={tokens.color.mythic} strokeOpacity="0.35" strokeDasharray="3 4" />
        <text x={W / 2} y={30} textAnchor="middle" fontSize="11" fill={tokens.color.mythic}>
          Sky (Uranus) · Olympus
        </text>
        {/* Ocean river encircling the earth */}
        <ellipse cx={W / 2} cy={py(52)} rx={W / 2 - 12} ry={42} fill="none" stroke="#5aa7d6" strokeOpacity="0.6" strokeWidth="6" />
        <ellipse cx={W / 2} cy={py(52)} rx={W / 2 - 34} ry={30} fill="url(#earthdisc)" stroke={tokens.color.bronze} strokeOpacity="0.5" />
        <text x={W / 2} y={py(52) + 4} textAnchor="middle" fontSize="11" fill={tokens.color.marble}>
          Earth (Gaia) — the known world
        </text>
        <text x={W - 20} y={py(52) - 34} textAnchor="end" fontSize="9" fill="#5aa7d6">
          Ocean (Oceanus)
        </text>
        <text x={18} y={py(52) + 52} fontSize="9" fill={tokens.color.mist}>
          ← West (sunset)
        </text>
        <text x={W - 18} y={py(52) + 52} textAnchor="end" fontSize="9" fill={tokens.color.mist}>
          East (dawn) →
        </text>
        {/* below: the underworld and Tartarus */}
        <path d={`M 90 ${py(66)} Q ${W / 2} ${H + 30} ${W - 90} ${py(66)}`} fill="#0b0d1a" stroke={tokens.color.mythic} strokeOpacity="0.3" />

        {mythical.map((l) => {
          const active = activeId === l.id || selection?.id === l.id;
          return (
            <g
              key={l.id}
              role="button"
              tabIndex={0}
              aria-label={`${l.ancientName} — mythical place, symbolic position only`}
              className="cursor-pointer outline-none"
              onClick={() => select({ kind: 'location', id: l.id })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  select({ kind: 'location', id: l.id });
                }
              }}
            >
              <circle cx={px(l.symbolic!.x)} cy={py(l.symbolic!.y)} r={active ? 8 : 5} fill={tokens.color.mythical} opacity={active ? 1 : 0.8} />
              {active ? <circle cx={px(l.symbolic!.x)} cy={py(l.symbolic!.y)} r={13} fill="none" stroke={tokens.color.gold} /> : null}
              <text
                x={px(l.symbolic!.x)}
                y={py(l.symbolic!.y) - 10}
                textAnchor={l.symbolic!.x < 15 ? 'start' : l.symbolic!.x > 85 ? 'end' : 'middle'}
                fontSize="10.5"
                fill={active ? tokens.color.gold : tokens.color.marble}
              >
                {l.ancientName.replace('The Underworld (House of Hades)', 'House of Hades')}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption id="symbolic-caption" className="px-1 pt-1 text-xs text-mist">
        Symbolic map. Mythical places have no coordinates on Earth, so they are shown in the shape of the mythic cosmos instead of as invented pins.
      </figcaption>
    </figure>
  );
}
