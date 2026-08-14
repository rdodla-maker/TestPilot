export type FactType = 'observed' | 'inferred';

export interface IntelligenceStatement {
  value: string | null;
  type: FactType;
  evidenceIds: string[];
  confidence?: number;
  reasoningSummary?: string;
}

export interface IntelligenceEvidence {
  id: string;
  text: string;
  source?: string;
}

export interface IntelligencePage {
  id: string;
  url: string;
  title: string | null;
  type: 'observed';
  purpose?: IntelligenceStatement;
  featureIds: string[];
  evidenceIds: string[];
}

export interface IntelligenceFeature {
  id: string;
  name: string;
  description?: string;
  type: FactType;
  relatedPageIds: string[];
  evidenceIds: string[];
  confidence?: number;
}

export interface IntelligenceRole {
  id: string;
  role: string;
  type: FactType;
  evidenceIds: string[];
  confidence?: number;
}

export interface IntelligenceWorkflow {
  id: string;
  name: string;
  description?: string;
  type: FactType;
  involvedPageIds: string[];
  involvedElements: string[];
  evidenceIds: string[];
  confidence?: number;
}

export interface IntelligenceRisk {
  id: string;
  area: string;
  reason?: string;
  type: FactType;
  evidenceIds: string[];
  confidence?: number;
}

export interface IntelligenceSnapshot {
  id: string;
  applicationId: string;
  schemaVersion: string;
  snapshotVersion: number;
  sourceExecutionId: string;
  generatedAt: string;
  createdAt: string;
  confidence: number;
  payload: {
    schemaVersion: string;
    generatedAt: string;
    sourceExecutionId: string;
    application: {
      id: string;
      name: IntelligenceStatement;
      type?: IntelligenceStatement;
      purpose?: IntelligenceStatement;
      businessDomain?: IntelligenceStatement;
    };
    characteristics: { applicationCategory?: IntelligenceStatement };
    pages: IntelligencePage[];
    features: IntelligenceFeature[];
    roles: IntelligenceRole[];
    workflows: IntelligenceWorkflow[];
    risks: IntelligenceRisk[];
    confidence: number;
    evidence: IntelligenceEvidence[];
    truncated: boolean;
  };
  metadata: {
    pageCount: number;
    roleCount: number;
    featureCount: number;
    workflowCount: number;
    riskCount: number;
    evidenceCount: number;
    snapshotBytes: number;
    truncated: boolean;
  };
}

export interface ApplicationProfile {
  id: string;
  name: string | null;
  targetUrls: string[];
  status: string;
  currentSnapshotId: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface DiscoveryResponse {
  projectId: string;
  executionId: string;
  status: string;
  applicationIntelligence?: IntelligenceSnapshot['payload'];
  persistence?: { status: string; applicationId: string; snapshotId?: string; snapshotVersion?: number };
}
