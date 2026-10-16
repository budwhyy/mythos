import type { Entity } from '@/lib/schema';

const GREEK_INITIAL: Record<string, string> = {};
const initialOf = (e: Entity) => GREEK_INITIAL[e.id] ?? (e.greek ? e.greek[0] : e.name[0]);

/**
 * A figure's portrait: a photograph of a real artefact that depicts them, with its museum credit.
 * Figures with no surviving ancient depiction get a marble medallion with their Greek initial — never an invented likeness.
 */
export default function Portrait({ entity, size = 'hero' }: { entity: Entity; size?: 'hero' | 'thumb' | 'list' }) {
  const img = entity.image;
  if (size !== 'hero') {
    const px = size === 'thumb' ? 56 : 28;
    return img ? (
      <img
        src={img.thumb ?? img.src}
        alt=""
        width={px}
        height={px}
        loading="lazy"
        className="shrink-0 rounded-full border border-gold/50 object-cover"
        style={{ width: px, height: px, objectPosition: img.focus ? `${img.focus.x}% ${img.focus.y}%` : 'center' }}
      />
    ) : (
      <span
        aria-hidden="true"
        className="font-display inline-flex shrink-0 items-center justify-center rounded-full border border-gold/40 bg-cosmos-3 text-gold"
        style={{ width: px, height: px, fontSize: px * 0.55 }}
      >
        {initialOf(entity)}
      </span>
    );
  }
  if (!img) {
    return (
      <figure className="mb-3 flex items-center gap-3">
        <span aria-hidden="true" className="font-display flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/50 bg-cosmos-3 text-4xl text-gold">
          {initialOf(entity)}
        </span>
        <figcaption className="text-xs text-mist">No surviving ancient depiction is bundled for this figure, so no likeness is invented.</figcaption>
      </figure>
    );
  }
  return (
    <figure className="mb-3">
      <img
        src={img.src}
        alt={img.alt}
        className="max-h-72 w-full rounded-lg border border-gold/25 bg-cosmos-3 object-contain"
        style={{ objectPosition: img.focus ? `${img.focus.x}% ${img.focus.y}%` : 'center' }}
      />
      <figcaption className="mt-1 text-xs text-mist">
        <a href={img.url} target="_blank" rel="noopener noreferrer" className="text-marble/85 hover:underline">
          {img.title}
        </a>
        {img.objectDate ? `, ${img.objectDate}` : ''}. {img.artist ? `Photo: ${img.artist}. ` : ''}
        {img.credit}. {img.licenceUrl ? (
          <a href={img.licenceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {img.licence}
          </a>
        ) : (
          img.licence
        )}
      </figcaption>
    </figure>
  );
}
