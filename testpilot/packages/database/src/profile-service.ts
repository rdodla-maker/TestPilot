import { validateApplicationIntelligenceSnapshot } from '@testpilot/agents-application-understanding';
import type { ApplicationIntelligenceSnapshot } from '@testpilot/contracts';
import type { ProfileRepository } from './repository.js';
import type { CreateProfileInput, IntelligenceSnapshotRecord, SnapshotComparison } from './types.js';

export class ProfilePersistenceError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

function names(items: Array<{ name?: string; role?: string; area?: string; title?: string | null; url?: string }>): Set<string> {
  return new Set(items.map((item) => item.name || item.role || item.area || item.title || item.url || '').filter(Boolean));
}

function difference(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((item) => !right.has(item));
}

export class ApplicationProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async createOrUpdateProfile(input: CreateProfileInput) {
    if (!input.id.trim()) throw new ProfilePersistenceError('INVALID_APPLICATION_ID', 'Application ID is required');
    return this.repository.createOrUpdateProfile(input);
  }

  async persistSnapshot(applicationId: string, sourceExecutionId: string, snapshot: ApplicationIntelligenceSnapshot): Promise<IntelligenceSnapshotRecord> {
    const validation = validateApplicationIntelligenceSnapshot(snapshot);
    if (!validation.valid) throw new ProfilePersistenceError('INVALID_SNAPSHOT', validation.errors.join('; '));
    try {
      return await this.repository.createSnapshot({ applicationId, sourceExecutionId, snapshot });
    } catch (error) {
      if (error instanceof Error && error.message === 'APPLICATION_PROFILE_NOT_FOUND') {
        throw new ProfilePersistenceError('APPLICATION_PROFILE_NOT_FOUND', 'Application profile was not found');
      }
      throw new ProfilePersistenceError('PERSISTENCE_FAILED', 'Application intelligence persistence failed');
    }
  }

  async getProfile(applicationId: string) {
    return this.repository.getProfile(applicationId);
  }

  async getSnapshot(snapshotId: string) {
    return this.repository.getSnapshot(snapshotId);
  }

  async getLatestSnapshot(applicationId: string) {
    return this.repository.getLatestSnapshot(applicationId);
  }

  async listSnapshots(applicationId: string) {
    return this.repository.listSnapshots(applicationId);
  }

  async getSnapshotByExecution(applicationId: string, sourceExecutionId: string) {
    return this.repository.getSnapshotByExecution(applicationId, sourceExecutionId);
  }

  compareSnapshots(from: IntelligenceSnapshotRecord, to: IntelligenceSnapshotRecord): SnapshotComparison {
    return {
      fromSnapshotId: from.id,
      toSnapshotId: to.id,
      addedPages: difference(names(to.payload.pages), names(from.payload.pages)),
      removedPages: difference(names(from.payload.pages), names(to.payload.pages)),
      addedFeatures: difference(names(to.payload.features), names(from.payload.features)),
      removedFeatures: difference(names(from.payload.features), names(to.payload.features)),
      addedRoles: difference(names(to.payload.roles), names(from.payload.roles)),
      removedRoles: difference(names(from.payload.roles), names(to.payload.roles)),
      addedWorkflows: difference(names(to.payload.workflows), names(from.payload.workflows)),
      removedWorkflows: difference(names(from.payload.workflows), names(to.payload.workflows)),
      addedRisks: difference(names(to.payload.risks), names(from.payload.risks)),
      removedRisks: difference(names(from.payload.risks), names(to.payload.risks)),
      changedApplication: JSON.stringify(from.payload.application) !== JSON.stringify(to.payload.application),
    };
  }
}