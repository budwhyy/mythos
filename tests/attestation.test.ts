import { describe, expect, it } from 'vitest';
import { firstAttestation, historicalById } from '@/lib/data';

const first = (id: string) => {
  const f = firstAttestation(id)!;
  return { ...f, h: historicalById.get(f.attestation.historicalRef)! };
};

describe('first attestation', () => {
  it('prefers a figure’s own record over records of events it appears in', () => {
    expect(first('zeus').attestation.id).toBe('att-zeus-pylos');
    expect(first('athena').attestation.id).toBe('att-athena-knossos');
  });
  it('never uses archaeological context, syncretism or reception as a first attestation when a record exists', () => {
    const f = first('trojan-war-myth');
    expect(f.attestation.kind).toBe('literary_codification');
    expect(f.h.id).toBe('homeric-epics');
    expect(first('olympian-age').attestation.kind).not.toMatch(/reception|syncretism/);
  });
  it('falls back through events for figures without a direct record', () => {
    expect(first('odysseus').h.id).toBe('homeric-epics');
    expect(first('chaos').h.id).toBe('hesiod-theogony-composed');
  });
});
