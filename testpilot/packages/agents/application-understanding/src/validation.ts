import type {
  ApplicationUnderstandingResult,
  EvidenceItem,
  InferenceWithEvidence,
  UserRole,
  Feature,
  WorkflowSummary,
  RiskArea,
} from '@testpilot/contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEvidenceItem(value: unknown): value is EvidenceItem {
  return isRecord(value) && typeof value.id === 'string' && typeof value.text === 'string' &&
    (value.source === undefined || typeof value.source === 'string');
}

function hasValidEvidence(value: unknown): value is Record<string, unknown> & { evidence: EvidenceItem[] } {
  return isRecord(value) && Array.isArray(value.evidence) && value.evidence.every(isEvidenceItem);
}

function hasValidConfidence(value: Record<string, unknown>): boolean {
  return value.confidence === undefined ||
    (typeof value.confidence === 'number' && value.confidence >= 0 && value.confidence <= 1);
}

function isInference(value: unknown): value is InferenceWithEvidence {
  return hasValidEvidence(value) && isRecord(value) && typeof value.value === 'string' && hasValidConfidence(value);
}

function isUserRole(value: unknown): value is UserRole {
  return hasValidEvidence(value) && isRecord(value) && typeof value.role === 'string' &&
    (value.description === undefined || typeof value.description === 'string') && hasValidConfidence(value);
}

function isFeature(value: unknown): value is Feature {
  return hasValidEvidence(value) && isRecord(value) && typeof value.name === 'string' &&
    (value.id === undefined || typeof value.id === 'string') &&
    (value.description === undefined || typeof value.description === 'string') && hasValidConfidence(value);
}

function isWorkflow(value: unknown): value is WorkflowSummary {
  return hasValidEvidence(value) && isRecord(value) && typeof value.name === 'string' &&
    (value.steps === undefined || (Array.isArray(value.steps) && value.steps.every((step) => typeof step === 'string'))) &&
    hasValidConfidence(value);
}

function isRiskArea(value: unknown): value is RiskArea {
  return hasValidEvidence(value) && isRecord(value) && typeof value.area === 'string' &&
    (value.reason === undefined || typeof value.reason === 'string') && hasValidConfidence(value);
}

export function isApplicationUnderstandingResult(value: unknown): value is ApplicationUnderstandingResult {
  if (!hasValidEvidence(value) || !isRecord(value) || !hasValidConfidence(value)) return false;
  return (value.applicationType === undefined || isInference(value.applicationType)) &&
    (value.applicationPurpose === undefined || isInference(value.applicationPurpose)) &&
    (value.businessDomain === undefined || isInference(value.businessDomain)) &&
    (value.userRoles === undefined || (Array.isArray(value.userRoles) && value.userRoles.every(isUserRole))) &&
    (value.features === undefined || (Array.isArray(value.features) && value.features.every(isFeature))) &&
    (value.workflows === undefined || (Array.isArray(value.workflows) && value.workflows.every(isWorkflow))) &&
    (value.riskAreas === undefined || (Array.isArray(value.riskAreas) && value.riskAreas.every(isRiskArea)));
}