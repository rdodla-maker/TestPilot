import type { ApplicationPageMetadata } from './metadata';
import type { ApplicationUnderstandingResult, EvidenceItem } from './application-understanding';
export declare const APPLICATION_INTELLIGENCE_SCHEMA_VERSION = "1.0";
export type IntelligenceFactType = 'observed' | 'inferred';
export type IntelligencePriority = 'high' | 'medium' | 'low';
export interface IntelligenceStatement<T> {
    value: T;
    type: IntelligenceFactType;
    evidenceIds: string[];
    confidence?: number;
    reasoningSummary?: string;
}
export interface ApplicationIdentity {
    id: 'APP-001';
    name: IntelligenceStatement<string | null>;
    type?: IntelligenceStatement<string>;
    purpose?: IntelligenceStatement<string>;
    businessDomain?: IntelligenceStatement<string>;
}
export interface ApplicationCharacteristics {
    applicationCategory?: IntelligenceStatement<string>;
}
export interface IntelligenceRole {
    id: string;
    role: string;
    type: IntelligenceFactType;
    evidenceIds: string[];
    confidence?: number;
}
export interface IntelligenceFeature {
    id: string;
    name: string;
    description?: string;
    type: IntelligenceFactType;
    relatedPageIds: string[];
    evidenceIds: string[];
    confidence?: number;
}
export interface IntelligenceWorkflow {
    id: string;
    name: string;
    description?: string;
    type: IntelligenceFactType;
    involvedPageIds: string[];
    involvedElements: string[];
    evidenceIds: string[];
    confidence?: number;
}
export interface IntelligenceRiskArea {
    id: string;
    area: string;
    reason?: string;
    type: IntelligenceFactType;
    evidenceIds: string[];
    confidence?: number;
}
export interface IntelligencePage {
    id: string;
    url: string;
    title: string | null;
    type: 'observed';
    purpose?: IntelligenceStatement<string>;
    featureIds: string[];
    evidenceIds: string[];
}
export interface IntelligenceTruncation {
    entities: string[];
    originalCounts: Record<string, number>;
}
export interface ApplicationIntelligenceSnapshot {
    schemaVersion: typeof APPLICATION_INTELLIGENCE_SCHEMA_VERSION;
    generatedAt: string;
    sourceExecutionId: string;
    application: ApplicationIdentity;
    characteristics: ApplicationCharacteristics;
    roles: IntelligenceRole[];
    features: IntelligenceFeature[];
    workflows: IntelligenceWorkflow[];
    risks: IntelligenceRiskArea[];
    pages: IntelligencePage[];
    confidence: number;
    evidence: EvidenceItem[];
    truncated: boolean;
    truncation?: IntelligenceTruncation;
}
export interface ApplicationIntelligenceRequest {
    projectId: string;
    sourceExecutionId: string;
    metadata: ApplicationPageMetadata;
    understanding: ApplicationUnderstandingResult;
    generatedAt?: string;
}
export interface ApplicationIntelligenceValidationResult {
    valid: boolean;
    errors: string[];
}
//# sourceMappingURL=application-intelligence.d.ts.map