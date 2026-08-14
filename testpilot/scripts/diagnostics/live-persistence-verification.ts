import { PrismaClient } from '@prisma/client';
import { ApplicationProfileService, PrismaProfileRepository } from '@testpilot/database';
import type { ApplicationIntelligenceSnapshot } from '@testpilot/contracts';

const prisma = new PrismaClient();
const repository = new PrismaProfileRepository(prisma);
const service = new ApplicationProfileService(repository);
const applicationId = 'live-verification-project';

function snapshot(feature: string, executionId: string): ApplicationIntelligenceSnapshot {
  return {
    schemaVersion: '1.0',
    generatedAt: '2026-08-17T13:40:00.000Z',
    sourceExecutionId: executionId,
    application: { id: 'APP-001', name: { value: 'Live TestPilot App', type: 'observed', evidenceIds: ['EV-LIVE'] } },
    characteristics: {},
    roles: [],
    features: [{ id: 'FEATURE-001', name: feature, type: 'inferred', relatedPageIds: ['PAGE-001'], evidenceIds: ['EV-LIVE'], confidence: 0.9 }],
    workflows: [],
    risks: [],
    pages: [{ id: 'PAGE-001', url: 'https://example.com', title: 'Live TestPilot App', type: 'observed', featureIds: ['FEATURE-001'], evidenceIds: ['EV-LIVE'] }],
    confidence: 0.9,
    evidence: [{ id: 'EV-LIVE', text: 'Controlled live persistence evidence', source: 'live-verification' }],
    truncated: false,
  };
}

async function main() {
  await service.createOrUpdateProfile({ id: applicationId, name: 'Live TestPilot App', targetUrls: ['https://example.com'] });
  const first = await service.persistSnapshot(applicationId, 'live-execution-1', snapshot('Search', 'live-execution-1'));
  const repeated = await service.persistSnapshot(applicationId, 'live-execution-1', snapshot('Search', 'live-execution-1'));
  const second = await service.persistSnapshot(applicationId, 'live-execution-2', snapshot('Checkout', 'live-execution-2'));
  const profile = await service.getProfile(applicationId);
  const current = await service.getLatestSnapshot(applicationId);
  const history = await service.listSnapshots(applicationId);
  const diff = service.compareSnapshots(first, second);

  let rollbackObserved = false;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.intelligenceSnapshot.create({
        data: {
          id: `${applicationId}:rollback`,
          applicationId,
          schemaVersion: '1.0',
          snapshotVersion: 999,
          sourceExecutionId: 'live-rollback',
          generatedAt: new Date(),
          confidence: 0.1,
          payload: snapshot('Rollback', 'live-rollback') as any,
          metadata: {},
        },
      });
      throw new Error('controlled rollback');
    });
  } catch {
    rollbackObserved = (await service.getSnapshot(`${applicationId}:rollback`)) === null;
  }

  console.log(JSON.stringify({
    applicationId,
    profileExists: profile?.id === applicationId,
    firstSnapshotId: first.id,
    firstVersion: first.snapshotVersion,
    repeatedSameId: repeated.id === first.id,
    secondSnapshotId: second.id,
    secondVersion: second.snapshotVersion,
    currentSnapshotId: current?.id,
    historyVersions: history.map((item) => item.snapshotVersion),
    payloadIntact: current?.payload.features[0]?.name === 'Checkout',
    sourceExecutionPreserved: current?.sourceExecutionId === 'live-execution-2',
    diff,
    rollbackObserved,
  }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
