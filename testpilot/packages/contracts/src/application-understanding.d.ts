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
    confidence?: number;
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
    confidence?: number;
    evidence: EvidenceItem[];
}
import type { ApplicationPageMetadata } from './metadata';
export type ApplicationUnderstandingRequest = {
    projectId: string;
    observationId?: string;
    applicationMetadata: ApplicationPageMetadata;
    environmentObservation?: any;
};
//# sourceMappingURL=application-understanding.d.ts.map