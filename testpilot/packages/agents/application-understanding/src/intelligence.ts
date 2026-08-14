import { getIntelligenceLimits, type IntelligenceLimits } from '@testpilot/config';
import type {
  ApplicationIntelligenceRequest,
  ApplicationIntelligenceSnapshot,
  ApplicationIntelligenceValidationResult,
  ApplicationUnderstandingResult,
  EvidenceItem,
  IntelligenceFeature,
  IntelligenceRiskArea,
  IntelligenceRole,
  IntelligenceStatement,
  IntelligenceWorkflow,
} from '@testpilot/contracts';
import { APPLICATION_INTELLIGENCE_SCHEMA_VERSION } from '@testpilot/contracts';

const ENTITY_ID_PATTERN = /^(APP|PAGE|ROLE|FEATURE|FLOW|RISK)-\d{3}$/;

export class ApplicationIntelligenceValidationError extends Error {
  readonly code = 'APPLICATION_INTELLIGENCE_INVALID';
  constructor(readonly errors: string[]) {
    super(`Application intelligence validation failed: ${errors.join('; ')}`);
  }
}

function normalizeText(value: string | null | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  url.hash = '';
  return url.toString();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function evidenceIds(items: EvidenceItem[] | undefined): string[] {
  return unique((items || []).map((item) => item.id).filter(Boolean));
}

function statement<T>(
  value: T | undefined,
  type: 'observed' | 'inferred',
  references: string[],
  confidence?: number,
  reasoningSummary?: string,
): IntelligenceStatement<T> | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return {
    value,
    type,
    evidenceIds: unique(references),
    confidence,
    reasoningSummary: normalizeText(reasoningSummary, 500),
  };
}

function addEvidence(target: Map<string, EvidenceItem>, item: EvidenceItem): void {
  if (!target.has(item.id)) {
    target.set(item.id, {
      id: item.id,
      text: normalizeText(item.text, 500) || 'Observed evidence',
      source: normalizeText(item.source, 500),
    });
  }
}

function normalizedKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function buildFeatures(
  understanding: ApplicationUnderstandingResult,
  pageId: string,
  maxLength: number,
): IntelligenceFeature[] {
  const seen = new Set<string>();
  return (understanding.features || []).reduce<IntelligenceFeature[]>((features, feature) => {
    const name = normalizeText(feature.name, maxLength);
    if (!name || seen.has(normalizedKey(name))) return features;
    seen.add(normalizedKey(name));
    features.push({
      id: `FEATURE-${String(features.length + 1).padStart(3, '0')}`,
      name,
      description: normalizeText(feature.description, maxLength),
      type: 'inferred',
      relatedPageIds: [pageId],
      evidenceIds: evidenceIds(feature.evidence),
      confidence: feature.confidence,
    });
    return features;
  }, []);
}

function buildWorkflows(
  understanding: ApplicationUnderstandingResult,
  pageId: string,
  maxLength: number,
): IntelligenceWorkflow[] {
  const seen = new Set<string>();
  return (understanding.workflows || []).reduce<IntelligenceWorkflow[]>((workflows, workflow) => {
    const name = normalizeText(workflow.name, maxLength);
    if (!name || seen.has(normalizedKey(name))) return workflows;
    seen.add(normalizedKey(name));
    workflows.push({
      id: `FLOW-${String(workflows.length + 1).padStart(3, '0')}`,
      name,
      description: undefined,
      type: 'inferred',
      involvedPageIds: [pageId],
      involvedElements: [],
      evidenceIds: evidenceIds(workflow.evidence),
      confidence: workflow.confidence,
    });
    return workflows;
  }, []);
}

function buildRoles(understanding: ApplicationUnderstandingResult, maxLength: number): IntelligenceRole[] {
  const seen = new Set<string>();
  return (understanding.userRoles || []).reduce<IntelligenceRole[]>((roles, role) => {
    const name = normalizeText(role.role, maxLength);
    if (!name || seen.has(normalizedKey(name))) return roles;
    seen.add(normalizedKey(name));
    roles.push({
      id: `ROLE-${String(roles.length + 1).padStart(3, '0')}`,
      role: name,
      type: 'inferred',
      evidenceIds: evidenceIds(role.evidence),
      confidence: role.confidence,
    });
    return roles;
  }, []);
}

function buildRisks(understanding: ApplicationUnderstandingResult, maxLength: number): IntelligenceRiskArea[] {
  const seen = new Set<string>();
  return (understanding.riskAreas || []).reduce<IntelligenceRiskArea[]>((risks, risk) => {
    const area = normalizeText(risk.area, maxLength);
    if (!area || seen.has(normalizedKey(area))) return risks;
    seen.add(normalizedKey(area));
    risks.push({
      id: `RISK-${String(risks.length + 1).padStart(3, '0')}`,
      area,
      reason: normalizeText(risk.reason, maxLength),
      type: 'inferred',
      evidenceIds: evidenceIds(risk.evidence),
      confidence: risk.confidence,
    });
    return risks;
  }, []);
}

function applyLimits(snapshot: ApplicationIntelligenceSnapshot, limits: IntelligenceLimits): ApplicationIntelligenceSnapshot {
  const originalCounts = {
    pages: snapshot.pages.length,
    features: snapshot.features.length,
    workflows: snapshot.workflows.length,
    roles: snapshot.roles.length,
    risks: snapshot.risks.length,
    evidence: snapshot.evidence.length,
  };
  const pages = snapshot.pages.slice(0, limits.maxPages);
  const features = snapshot.features.slice(0, limits.maxFeatures);
  const workflows = snapshot.workflows.slice(0, limits.maxWorkflows);
  const roles = snapshot.roles.slice(0, limits.maxRoles);
  const risks = snapshot.risks.slice(0, limits.maxRisks);
  const retainedFeatureIds = new Set(features.map((item) => item.id));
  pages.forEach((page) => {
    page.featureIds = page.featureIds.filter((featureId) => retainedFeatureIds.has(featureId));
  });
  const retainedReferences = new Set([
    ...snapshot.application.name.evidenceIds,
    ...(snapshot.application.type?.evidenceIds || []),
    ...(snapshot.application.purpose?.evidenceIds || []),
    ...(snapshot.application.businessDomain?.evidenceIds || []),
    ...pages.flatMap((item) => item.evidenceIds),
    ...features.flatMap((item) => item.evidenceIds),
    ...workflows.flatMap((item) => item.evidenceIds),
    ...roles.flatMap((item) => item.evidenceIds),
    ...risks.flatMap((item) => item.evidenceIds),
  ]);
  const evidence = snapshot.evidence.filter((item) => retainedReferences.has(item.id)).slice(0, limits.maxEvidence);
  const entities = Object.entries(originalCounts)
    .filter(([key, count]) => count > (limits as unknown as Record<string, number>)[`max${key[0].toUpperCase()}${key.slice(1)}`])
    .map(([key]) => key);
  const truncated = entities.length > 0 || evidence.length < originalCounts.evidence;
  return {
    ...snapshot,
    pages,
    features,
    workflows,
    roles,
    risks,
    evidence,
    truncated,
    truncation: truncated ? { entities, originalCounts } : undefined,
  };
}

export function buildApplicationIntelligenceSnapshot(
  input: ApplicationIntelligenceRequest,
  limits: IntelligenceLimits = getIntelligenceLimits(),
): ApplicationIntelligenceSnapshot {
  const maxLength = limits.maxStringLength;
  const evidence = new Map<string, EvidenceItem>();
  input.understanding.evidence.forEach((item) => addEvidence(evidence, item));
  addEvidence(evidence, { id: 'page-001', source: 'metadata.page', text: JSON.stringify(input.metadata.page) });

  const pageId = 'PAGE-001';
  const page: ApplicationIntelligenceSnapshot['pages'][number] = {
    id: pageId,
    url: normalizeUrl(input.metadata.page.url),
    title: normalizeText(input.metadata.page.title, maxLength) || null,
    type: 'observed',
    featureIds: [],
    evidenceIds: ['page-001'],
  };
  const features = buildFeatures(input.understanding, pageId, maxLength);
  page.featureIds = features.map((feature) => feature.id);
  const type = input.understanding.applicationType;
  const purpose = input.understanding.applicationPurpose;
  const domain = input.understanding.businessDomain;
  const application: ApplicationIntelligenceSnapshot['application'] = {
    id: 'APP-001',
    name: { value: page.title, type: 'observed', evidenceIds: page.evidenceIds },
    type: statement(type?.value, 'inferred', evidenceIds(type?.evidence), type?.confidence),
    purpose: statement(purpose?.value, 'inferred', evidenceIds(purpose?.evidence), purpose?.confidence),
    businessDomain: statement(domain?.value, 'inferred', evidenceIds(domain?.evidence), domain?.confidence),
  };
  const snapshot: ApplicationIntelligenceSnapshot = {
    schemaVersion: APPLICATION_INTELLIGENCE_SCHEMA_VERSION,
    generatedAt: input.generatedAt || new Date().toISOString(),
    sourceExecutionId: input.sourceExecutionId,
    application,
    characteristics: type ? { applicationCategory: statement(type.value, 'inferred', evidenceIds(type.evidence), type.confidence) } : {},
    roles: buildRoles(input.understanding, maxLength),
    features,
    workflows: buildWorkflows(input.understanding, pageId, maxLength),
    risks: buildRisks(input.understanding, maxLength),
    pages: [page],
    confidence: input.understanding.confidence ?? 0,
    evidence: [...evidence.values()],
    truncated: false,
  };
  const limited = applyLimits(snapshot, limits);
  const validation = validateApplicationIntelligenceSnapshot(limited, limits);
  if (!validation.valid) throw new ApplicationIntelligenceValidationError(validation.errors);
  if (Buffer.byteLength(JSON.stringify(limited)) > limits.maxSnapshotBytes) {
    throw new ApplicationIntelligenceValidationError(['snapshot exceeds configured byte limit']);
  }
  return limited;
}

function checkConfidence(value: number | undefined, path: string, errors: string[]): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1)) errors.push(`${path} must be between 0 and 1`);
}

function checkReferences(references: string[], evidence: Set<string>, path: string, errors: string[]): void {
  references.forEach((reference) => {
    if (!evidence.has(reference)) errors.push(`${path} references missing evidence ${reference}`);
  });
}

export function validateApplicationIntelligenceSnapshot(
  value: unknown,
  limits: IntelligenceLimits = getIntelligenceLimits(),
): ApplicationIntelligenceValidationResult {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') return { valid: false, errors: ['snapshot must be an object'] };
  const snapshot = value as Partial<ApplicationIntelligenceSnapshot>;
  if (snapshot.schemaVersion !== APPLICATION_INTELLIGENCE_SCHEMA_VERSION) errors.push('invalid schemaVersion');
  if (!snapshot.generatedAt || Number.isNaN(Date.parse(snapshot.generatedAt))) errors.push('generatedAt must be an ISO date');
  if (!snapshot.sourceExecutionId) errors.push('sourceExecutionId is required');
  if (!snapshot.application || snapshot.application.id !== 'APP-001') errors.push('application identity is required');
  if (!Array.isArray(snapshot.pages)) errors.push('pages is required');
  if (!Array.isArray(snapshot.roles)) errors.push('roles is required');
  if (!Array.isArray(snapshot.features)) errors.push('features is required');
  if (!Array.isArray(snapshot.workflows)) errors.push('workflows is required');
  if (!Array.isArray(snapshot.risks)) errors.push('risks is required');
  if (typeof snapshot.truncated !== 'boolean') errors.push('truncated is required');
  checkConfidence(snapshot.confidence, 'confidence', errors);
  const evidence = Array.isArray(snapshot.evidence) ? snapshot.evidence : [];
  const evidenceIdsSet = new Set<string>();
  evidence.forEach((item, index) => {
    if (!item?.id || evidenceIdsSet.has(item.id)) errors.push(`evidence[${index}] has a duplicate or missing id`);
    if (!item?.text || item.text.length > limits.maxStringLength) errors.push(`evidence[${index}].text is invalid`);
    evidenceIdsSet.add(item?.id || '');
  });
  if (evidence.length > limits.maxEvidence) errors.push('evidence exceeds configured limit');
  const entities = [
    ...(snapshot.application ? [snapshot.application] : []),
    ...(snapshot.pages || []),
    ...(snapshot.roles || []),
    ...(snapshot.features || []),
    ...(snapshot.workflows || []),
    ...(snapshot.risks || []),
  ];
  const ids = new Set<string>();
  entities.forEach((entity, index) => {
    if (!entity.id || !ENTITY_ID_PATTERN.test(entity.id) || ids.has(entity.id)) errors.push(`entity[${index}] has an invalid or duplicate id`);
    ids.add(entity.id || '');
  });
  (snapshot.application ? [snapshot.application.name, snapshot.application.type, snapshot.application.purpose, snapshot.application.businessDomain] : [])
    .filter(Boolean)
    .forEach((item) => {
      checkConfidence(item?.confidence, 'application statement', errors);
      checkReferences(item?.evidenceIds || [], evidenceIdsSet, 'application statement', errors);
    });
  (snapshot.roles || []).forEach((item) => { checkConfidence(item.confidence, item.id, errors); checkReferences(item.evidenceIds, evidenceIdsSet, item.id, errors); });
  (snapshot.features || []).forEach((item) => { checkConfidence(item.confidence, item.id, errors); checkReferences(item.evidenceIds, evidenceIdsSet, item.id, errors); });
  (snapshot.workflows || []).forEach((item) => { checkConfidence(item.confidence, item.id, errors); checkReferences(item.evidenceIds, evidenceIdsSet, item.id, errors); });
  (snapshot.risks || []).forEach((item) => { checkConfidence(item.confidence, item.id, errors); checkReferences(item.evidenceIds, evidenceIdsSet, item.id, errors); });
  (snapshot.pages || []).forEach((item) => {
    try { normalizeUrl(item.url); } catch { errors.push(`${item.id} has an invalid URL`); }
    checkReferences(item.evidenceIds, evidenceIdsSet, item.id, errors);
    (item.featureIds || []).forEach((featureId) => {
      if (!(snapshot.features || []).some((feature) => feature.id === featureId)) errors.push(`${item.id} references missing feature ${featureId}`);
    });
  });
  if ((snapshot.pages || []).length > limits.maxPages) errors.push('pages exceeds configured limit');
  if ((snapshot.features || []).length > limits.maxFeatures) errors.push('features exceeds configured limit');
  if ((snapshot.workflows || []).length > limits.maxWorkflows) errors.push('workflows exceeds configured limit');
  if ((snapshot.roles || []).length > limits.maxRoles) errors.push('roles exceeds configured limit');
  if ((snapshot.risks || []).length > limits.maxRisks) errors.push('risks exceeds configured limit');
  if (Buffer.byteLength(JSON.stringify(value)) > limits.maxSnapshotBytes) errors.push('snapshot exceeds configured byte limit');
  return { valid: errors.length === 0, errors };
}

export const buildApplicationIntelligence = buildApplicationIntelligenceSnapshot;