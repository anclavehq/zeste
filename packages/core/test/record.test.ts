import { describe, expect, it } from 'vitest';
import { createConsent, memoryStorage, type ConsentRecord, type ServiceDefinition } from '../src/index.ts';

const service = (key: string, needsConsent = true): ServiceDefinition => ({
  key,
  name: key,
  category: 'analytic',
  needsConsent,
  cookies: [],
  onGrant: () => {},
});

function setup(stored: Record<string, string> = {}, policyVersion?: string) {
  const records: ConsentRecord[] = [];
  const storage = memoryStorage(stored);
  const consent = createConsent({
    services: [service('gtag'), service('youtube'), service('exempt', false)],
    storage,
    policyVersion,
    expose: false,
    delegateClicks: false,
    onRecord: (record) => records.push(record),
  });
  consent.start();
  return { consent, storage, records };
}

describe('onRecord', () => {
  it('reports each choice with every consented service, its action and a date', () => {
    const { consent, records } = setup({}, '2');
    consent.grant('youtube');
    consent.denyAll();
    expect(records.map((r) => [r.action, r.choices])).toEqual([
      ['grant', { youtube: true }],
      ['denyAll', { gtag: false, youtube: false }],
    ]);
    expect(records[1]!.policyVersion).toBe('2');
    expect(Date.parse(records[1]!.date)).toBeGreaterThan(Date.now() - 5000);
  });

  it('keeps the same random identifier in the cookie, across visits', () => {
    const first = setup();
    first.consent.grantAll();
    const id = first.records[0]!.id;
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(first.storage.read()._id).toBe(id);

    const next = setup(first.storage.read());
    next.consent.set({ gtag: false });
    expect(next.records).toEqual([expect.objectContaining({ id, action: 'set', choices: { gtag: false, youtube: true } })]);
  });

  it('is silent when the stored choice is read back or nothing changes', () => {
    const { consent, records } = setup({ gtag: 'false', youtube: 'false' });
    consent.denyAll();
    expect(records).toEqual([]);
  });

  it('two visitors get different identifiers', () => {
    const a = setup();
    const b = setup();
    a.consent.grantAll();
    b.consent.grantAll();
    expect(a.records[0]!.id).not.toBe(b.records[0]!.id);
  });
});
