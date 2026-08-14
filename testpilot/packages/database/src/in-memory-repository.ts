import type { ProfileRepository } from './repository.js';
import type { ApplicationProfileRecord, CreateProfileInput, CreateSnapshotInput, IntelligenceSnapshotRecord } from './types.js';

export class InMemoryProfileRepository implements ProfileRepository {
  private readonly profiles = new Map<string, ApplicationProfileRecord>();
  private readonly snapshots = new Map<string, IntelligenceSnapshotRecord>();

  async createOrUpdateProfile(input: CreateProfileInput): Promise<ApplicationProfileRecord> {
    const now = new Date();
    const existing = this.profiles.get(input.id);
    const record: ApplicationProfileRecord = existing
      ? { ...existing, name: input.name ?? existing.name, targetUrls: input.targetUrls ?? existing.targetUrls, updatedAt: now }
      : { id: input.id, name: input.name ?? null, targetUrls: input.targetUrls ?? [], status: 'active', currentSnapshotId: null, createdAt: now, updatedAt: now };
    this.profiles.set(input.id, record);
    return { ...record };
  }

  async getProfile(id: string): Promise<ApplicationProfileRecord | null> {
    const record = this.profiles.get(id);
    return record ? { ...record } : null;
  }

  async createSnapshot(input: CreateSnapshotInput): Promise<IntelligenceSnapshotRecord> {
    const profile = this.profiles.get(input.applicationId);
    if (!profile) throw new Error('APPLICATION_PROFILE_NOT_FOUND');
    const existing = await this.getSnapshotByExecution(input.applicationId, input.sourceExecutionId);
    if (existing) return existing;
    const versions = [...this.snapshots.values()].filter((item) => item.applicationId === input.applicationId).map((item) => item.snapshotVersion);
    const snapshotVersion = versions.length ? Math.max(...versions) + 1 : 1;
    const now = new Date();
    const record: IntelligenceSnapshotRecord = {
      id: `${input.applicationId}:snapshot:${snapshotVersion}`,
      applicationId: input.applicationId,
      schemaVersion: input.snapshot.schemaVersion,
      snapshotVersion,
      sourceExecutionId: input.sourceExecutionId,
      generatedAt: new Date(input.snapshot.generatedAt),
      confidence: input.snapshot.confidence,
      payload: input.snapshot,
      metadata: {
        pageCount: input.snapshot.pages.length,
        roleCount: input.snapshot.roles.length,
        featureCount: input.snapshot.features.length,
        workflowCount: input.snapshot.workflows.length,
        riskCount: input.snapshot.risks.length,
        evidenceCount: input.snapshot.evidence.length,
        snapshotBytes: Buffer.byteLength(JSON.stringify(input.snapshot)),
        truncated: input.snapshot.truncated,
      },
      createdAt: now,
      updatedAt: now,
    };
    this.snapshots.set(record.id, record);
    this.profiles.set(profile.id, { ...profile, currentSnapshotId: record.id, updatedAt: now });
    return { ...record };
  }

  async getSnapshot(id: string): Promise<IntelligenceSnapshotRecord | null> {
    return this.snapshots.get(id) || null;
  }

  async getLatestSnapshot(applicationId: string): Promise<IntelligenceSnapshotRecord | null> {
    return (await this.listSnapshots(applicationId))[0] || null;
  }

  async listSnapshots(applicationId: string): Promise<IntelligenceSnapshotRecord[]> {
    return [...this.snapshots.values()].filter((item) => item.applicationId === applicationId).sort((a, b) => b.snapshotVersion - a.snapshotVersion);
  }

  async getSnapshotByExecution(applicationId: string, sourceExecutionId: string): Promise<IntelligenceSnapshotRecord | null> {
    return [...this.snapshots.values()].find((item) => item.applicationId === applicationId && item.sourceExecutionId === sourceExecutionId) || null;
  }
}