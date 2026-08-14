/**
 * Application Understanding contracts
 * Represents structured result from an AI model that reasons over deterministic evidence.
 */

export type EvidenceItem = {
  id: string;
  text: string;
  source?: string;
};

export type InferenceWithEvidence<T = string> = {
  value: T;
  evidence: EvidenceItem[];
  confidence?: number; // 0..1
};

export type UserRole = {
  role: string;
  description?: string;
  evidence: EvidenceItem[];
  confidence?: number;
};

export type Feature = {
  id?: string;
  name: string;
  description?: string;
  evidence: EvidenceItem[];
  confidence?: number;
};

export type WorkflowSummary = {
  name: string;
  steps?: string[];
  evidence: EvidenceItem[];
  confidence?: number;
};

export type RiskArea = {
  area: string;
  reason?: string;
  evidence: EvidenceItem[];
  confidence?: number;
 };

export interface ApplicationUnderstandingResult {
  applicationType?: InferenceWithEvidence<string>;
  applicationPurpose?: InferenceWithEvidence<string>;
  businessDomain?: InferenceWithEvidence<string>;
  userRoles?: UserRole[];
  features?: Feature[];
  workflows?: WorkflowSummary[];
  riskAreas?: RiskArea[];
  confidence?: number; // overall confidence 0..1
  evidence: EvidenceItem[]; // canonical list of observed facts passed to the model
}

import type { ApplicationPageMetadata } from './metadata';

export type ApplicationUnderstandingRequest = {
  projectId: string;
  observationId?: string;
  // structured evidence produced by Level 1.2
  applicationMetadata: ApplicationPageMetadata;
  environmentObservation?: any;
};
