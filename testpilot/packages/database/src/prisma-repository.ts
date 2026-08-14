import { PrismaClient } from '@prisma/client';
import type { ProfileRepository } from './repository.js';
import type { ApplicationProfileRecord, CreateProfileInput, CreateSnapshotInput, IntelligenceSnapshotRecord, SnapshotMetadata } from './types.js';
import type { ApplicationIntelligenceSnapshot } from '@testpilot/contracts';

function profileFromRow(row: any): ApplicationProfileRecord {
  return { ...row, targetUrls: row.targetUrls as string[] };
}

function snapshotFromRow(row: any): IntelligenceSnapshotRecord {
  return { ...row, payload: row.payload as ApplicationIntelligenceSnapshot, metadata: row.metadata as SnapshotMetadata };
}

export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createOrUpdateProfile(input: CreateProfileInput): Promise<ApplicationProfileRecord> {
    const row = await this.prisma.applicationProfile.upsert({
      where: { id: input.id },
      create: { id: input.id, name: input.name ?? null, targetUrls: input.targetUrls ?? [] },
      update: { name: input.name ?? undefined, targetUrls: input.targetUrls ?? undefined },
    });
    return profileFromRow(row);
  }

  async getProfile(id: string): Promise<ApplicationProfileRecord | null> {
    const row = await this.prisma.applicationProfile.findUnique({ where: { id } });
    return row ? profileFromRow(row) : null;
  }

  async createSnapshot(input: CreateSnapshotInput): Promise<IntelligenceSnapshotRecord> {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.applicationProfile.findUnique({ where: { id: input.applicationId } });
      if (!profile) throw new Error('APPLICATION_PROFILE_NOT_FOUND');
      const existing = await tx.intelligenceSnapshot.findFirst({ where: { applicationId: input.applicationId, sourceExecutionId: input.sourceExecutionId } });
      if (existing) return snapshotFromRow(existing);
      const latest = await tx.intelligenceSnapshot.findFirst({ where: { applicationId: input.applicationId }, orderBy: { snapshotVersion: 'desc' } });
      const snapshotVersion = (latest?.snapshotVersion || 0) + 1;
      const id = `${input.applicationId}:snapshot:${snapshotVersion}`;
      const metadata: SnapshotMetadata = {
        pageCount: input.snapshot.pages.length,
        roleCount: input.snapshot.roles.length,
        featureCount: input.snapshot.features.length,
        workflowCount: input.snapshot.workflows.length,
        riskCount: input.snapshot.risks.length,
        evidenceCount: input.snapshot.evidence.length,
        snapshotBytes: Buffer.byteLength(JSON.stringify(input.snapshot)),
        truncated: input.snapshot.truncated,
      };
      const row = await tx.intelligenceSnapshot.create({
        data: {
          id,
          applicationId: input.applicationId,
          schemaVersion: input.snapshot.schemaVersion,
          snapshotVersion,
          sourceExecutionId: input.sourceExecutionId,
          generatedAt: new Date(input.snapshot.generatedAt),
          confidence: input.snapshot.confidence,
          payload: input.snapshot as any,
          metadata: metadata as any,
        },
      });
      await tx.applicationProfile.update({ where: { id: input.applicationId }, data: { currentSnapshotId: id } });
      return snapshotFromRow(row);
    });
  }

  async getSnapshot(id: string): Promise<IntelligenceSnapshotRecord | null> {
    const row = await this.prisma.intelligenceSnapshot.findUnique({ where: { id } });
    return row ? snapshotFromRow(row) : null;
  }

  async getLatestSnapshot(applicationId: string): Promise<IntelligenceSnapshotRecord | null> {
    const row = await this.prisma.intelligenceSnapshot.findFirst({ where: { applicationId }, orderBy: { snapshotVersion: 'desc' } });
    return row ? snapshotFromRow(row) : null;
  }

  async listSnapshots(applicationId: string): Promise<IntelligenceSnapshotRecord[]> {
    const rows = await this.prisma.intelligenceSnapshot.findMany({ where: { applicationId }, orderBy: { snapshotVersion: 'desc' } });
    return rows.map(snapshotFromRow);
  }

  async getSnapshotByExecution(applicationId: string, sourceExecutionId: string): Promise<IntelligenceSnapshotRecord | null> {
    const row = await this.prisma.intelligenceSnapshot.findUnique({ where: { applicationId_sourceExecutionId: { applicationId, sourceExecutionId } } });
    return row ? snapshotFromRow(row) : null;
  }
}