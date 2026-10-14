'use client';

import { useRouter } from 'next/navigation';
import { data, kindOf, labelOf } from '@/lib/data';
import { useStore } from '@/lib/store';

const MODE_HREF = { timeline: '/timeline/', tree: '/tree/', character: '/character/', map: '/map/', relationship: '/relationship/' } as const;
const MODE_LABEL = { timeline: 'Timeline', tree: 'Family Tree', character: 'Character', map: 'Map', relationship: 'Relationship' } as const;

export default function LearningView() {
  const stepIndex = useStore((s) => s.learnStep);
  const setStep = useStore((s) => s.setLearnStep);
  const select = useStore((s) => s.select);
  const router = useRouter();
  const steps = data.learning;
  const i = Math.min(stepIndex, steps.length - 1);
  const step = steps[i];

  const tryIt = () => {
    if (step.focus) {
      const kind = kindOf(step.focus);
      if (kind) select({ kind, id: step.focus });
    }
    router.push(MODE_HREF[step.mode]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Learning path · for beginners</p>
        <h1 className="font-display text-4xl text-gold">Eight steps into Greek myth</h1>
      </header>

      <nav aria-label="Learning steps">
        <ol className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {steps.map((s, k) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setStep(k)}
                aria-current={k === i ? 'step' : undefined}
                aria-label={`Step ${k + 1}: ${s.title}${k < i ? ' (done)' : ''}`}
                className={`h-2 w-full rounded-full ${k === i ? 'bg-gold' : k < i ? 'bg-gold/50' : 'bg-cosmos-3'}`}
              />
            </li>
          ))}
        </ol>
      </nav>

      <article className="panel space-y-4 p-6" aria-labelledby="learn-title" data-testid="learning-step">
        <p className="text-sm text-mist">
          Step {i + 1} of {steps.length} · in {MODE_LABEL[step.mode]} mode
        </p>
        <h2 id="learn-title" className="font-display text-3xl text-gold">
          {step.title}
        </h2>
        <p className="text-lg leading-relaxed text-marble/95">{step.body}</p>
        <p className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-marble">
          <span className="text-xs font-semibold uppercase tracking-wide text-gold">Key idea · </span>
          {step.takeaway}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-active" onClick={tryIt}>
            Explore in {MODE_LABEL[step.mode]}
            {step.focus ? ` → ${labelOf(step.focus)}` : ''}
          </button>
        </div>
      </article>

      <div className="flex justify-between">
        <button type="button" className="btn" disabled={i === 0} onClick={() => setStep(i - 1)}>
          ← Previous
        </button>
        {i < steps.length - 1 ? (
          <button type="button" className="btn" onClick={() => setStep(i + 1)}>
            Next step →
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => setStep(0)}>
            Start again
          </button>
        )}
      </div>
    </div>
  );
}
