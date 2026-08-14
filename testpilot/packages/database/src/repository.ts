import type { CreateProfileInput, CreateSnapshotInput, ApplicationProfileRecord, IntelligenceSnapshotRecord } from './types';

export interface ProfileRepository {
  createOrUpdateProfile(input: CreateProfileInput): Promise<ApplicationProfileRecord>;
  getProfile(id: string): Promise<ApplicationProfileRecord | null>;
  createSnapshot(input: CreateSnapshotInput): Promise<IntelligenceSnapshotRecord>;
  getSnapshot(id: string): Promise<IntelligenceSnapshotRecord | null>;
  getLatestSnapshot(applicationId: string): Promise<IntelligenceSnapshotRecord | null>;
  listSnapshots(applicationId: string): Promise<IntelligenceSnapshotRecord[]>;
  getSnapshotByExecution(applicationId: string, sourceExecutionId: string): Promise<IntelligenceSnapshotRecord | null>;
}