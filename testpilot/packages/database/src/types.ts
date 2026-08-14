import type { ApplicationIntelligenceSnapshot } from '@testpilot/contracts';

export interface ApplicationProfileRecord {
  id: string;
  name: string | null;
  targetUrls: string[];
  status: string;
  currentSnapshotId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntelligenceSnapshotRecord {
  id: string;
  applicationId: string;
  schemaVersion: string;
  snapshotVersion: number;
  sourceExecutionId: string;
  generatedAt: Date;
  confidence: number;
  payload: ApplicationIntelligenceSnapshot;
  metadata: SnapshotMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SnapshotMetadata {
  pageCount: number;
  roleCount: number;
  featureCount: number;
  workflowCount: number;
  riskCount: number;
  evidenceCount: number;
  snapshotBytes: number;
  truncated: boolean;
}

export interface CreateProfileInput {
  id: string;
  name?: string | null;
  targetUrls?: string[];
}

export interface CreateSnapshotInput {
  applicationId: string;
  sourceExecutionId: string;
  snapshot: ApplicationIntelligenceSnapshot;
}

export interface SnapshotComparison {
  fromSnapshotId: string;
  toSnapshotId: string;
  addedPages: string[];
  removedPages: string[];
  addedFeatures: string[];
  removedFeatures: string[];
  addedRoles: string[];
  removedRoles: string[];
  addedWorkflows: string[];
  removedWorkflows: string[];
  addedRisks: string[];
  removedRisks: string[];
  changedApplication: boolean;
}