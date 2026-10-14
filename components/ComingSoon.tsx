import Link from 'next/link';

export default function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-20 text-center" aria-labelledby="soon-title">
      <p className="text-xs uppercase tracking-[0.3em] text-mist">Coming soon</p>
      <h1 id="soon-title" className="font-display mt-2 text-5xl text-gold">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-marble/85">{blurb}</p>
      <p className="mt-6 text-sm text-mist">
        This mode is not built in prototype v0.1. Nothing here is placeholder content pretending to be real.
      </p>
      <Link href="/timeline/" className="btn mt-8">
        Return to the Timeline
      </Link>
    </section>
  );
}
