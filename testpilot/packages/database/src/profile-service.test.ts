import { describe, expect, it } from 'vitest';
import type { ApplicationIntelligenceSnapshot } from '@testpilot/contracts';
import { ApplicationProfileService } from './profile-service';
import { InMemoryProfileRepository } from './in-memory-repository';

function snapshot(featureName = 'Search'): ApplicationIntelligenceSnapshot {
  return {
    schemaVersion: '1.0',
    generatedAt: '2026-08-17T00:00:00.000Z',
    sourceExecutionId: `execution-${featureName}`,
    application: {
      id: 'APP-001',
      name: { value: 'Test App', type: 'observed', evidenceIds: ['EV-001'] },
    },
    characteristics: {},
    roles: [],
    features: [{ id: 'FEATURE-001', name: featureName, type: 'inferred', relatedPageIds: ['PAGE-001'], evidenceIds: ['EV-001'], confidence: 0.8 }],
    workflows: [],
    risks: [],
    pages: [{ id: 'PAGE-001', url: 'https://example.com', title: 'Test App', type: 'observed', featureIds: ['FEATURE-001'], evidenceIds: ['EV-001'] }],
    confidence: 0.8,
    evidence: [{ id: 'EV-001', text: 'Observed page', source: 'page' }],
    truncated: false,
  };
}

describe('ApplicationProfileService', () => {
  it('persists current and historical snapshots with idempotent executions', async () => {
    const repository = new InMemoryProfileRepository();
    const service = new ApplicationProfileService(repository);
    await service.createOrUpdateProfile({ id: 'project-1', name: 'Test App', targetUrls: ['https://example.com'] });

    const first = await service.persistSnapshot('project-1', 'execution-1', snapshot());
    const repeated = await service.persistSnapshot('project-1', 'execution-1', snapshot());
    const second = await service.persistSnapshot('project-1', 'execution-2', snapshot('Checkout'));

    expect(first.snapshotVersion).toBe(1);
    expect(repeated.id).toBe(first.id);
    expect(second.snapshotVersion).toBe(2);
    expect((await service.getLatestSnapshot('project-1'))?.id).toBe(second.id);
    expect((await service.listSnapshots('project-1')).map((item) => item.snapshotVersion)).toEqual([2, 1]);
  });

  it('rejects invalid snapshots before repository persistence', async () => {
    const repository = new InMemoryProfileRepository();
    const service = new ApplicationProfileService(repository);
    await service.createOrUpdateProfile({ id: 'project-1' });
    await expect(service.persistSnapshot('project-1', 'execution-1', { ...snapshot(), confidence: 2 })).rejects.toMatchObject({ code: 'INVALID_SNAPSHOT' });
  });

  it('compares structural changes deterministically', async () => {
    const repository = new InMemoryProfileRepository();
    const service = new ApplicationProfileService(repository);
    await service.createOrUpdateProfile({ id: 'project-1' });
    const first = await service.persistSnapshot('project-1', 'execution-1', snapshot());
    const second = await service.persistSnapshot('project-1', 'execution-2', snapshot('Checkout'));
    const diff = service.compareSnapshots(first, second);

    expect(diff.addedFeatures).toEqual(['Checkout']);
    expect(diff.removedFeatures).toEqual(['Search']);
  });
});