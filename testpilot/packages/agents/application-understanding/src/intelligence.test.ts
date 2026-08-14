import { describe, expect, it } from 'vitest';
import type { ApplicationIntelligenceSnapshot, ApplicationPageMetadata, ApplicationUnderstandingResult } from '@testpilot/contracts';
import { buildApplicationIntelligenceSnapshot, validateApplicationIntelligenceSnapshot } from './intelligence';

const metadata = {
  page: { title: '  Search   Portal ', url: 'https://example.com/search#section' },
  headings: [], links: [], buttons: [], inputs: [], forms: [], selects: [], textareas: [], images: [], navigation: [],
  summary: { links: 0, buttons: 0, inputs: 0, forms: 0, selects: 0, textareas: 0, images: 0, headings: 0, navigationRegions: 0 },
} as ApplicationPageMetadata;

const understanding: ApplicationUnderstandingResult = {
  applicationType: { value: 'web', evidence: [{ id: 'EV-001', text: 'web page', source: 'page' }], confidence: 0.8 },
  applicationPurpose: { value: 'search', evidence: [{ id: 'EV-001', text: 'web page', source: 'page' }], confidence: 0.7 },
  userRoles: [{ role: 'User', evidence: [{ id: 'EV-001', text: 'web page' }] }, { role: ' user ', evidence: [{ id: 'EV-001', text: 'web page' }] }],
  features: [{ name: 'Search', evidence: [{ id: 'EV-001', text: 'search' }] }, { name: 'search', evidence: [{ id: 'EV-001', text: 'search' }] }],
  workflows: [],
  riskAreas: [],
  confidence: 0.75,
  evidence: [{ id: 'EV-001', text: 'web page', source: 'page' }],
};

function snapshot(): ApplicationIntelligenceSnapshot {
  return buildApplicationIntelligenceSnapshot({
    projectId: 'project-1',
    sourceExecutionId: 'execution-1',
    generatedAt: '2026-08-17T00:00:00.000Z',
    metadata,
    understanding,
  });
}

describe('Application intelligence snapshot', () => {
  it('normalizes URLs and conservatively deduplicates entities', () => {
    const result = snapshot();
    expect(result.pages[0].url).toBe('https://example.com/search');
    expect(result.roles).toHaveLength(1);
    expect(result.features).toHaveLength(1);
    expect(result.application.type?.type).toBe('inferred');
    expect(result.application.name.type).toBe('observed');
  });

  it('rejects invalid schema, confidence, IDs, URLs, duplicates, and evidence references', () => {
    const result = snapshot();
    const invalid = structuredClone(result) as ApplicationIntelligenceSnapshot;
    invalid.schemaVersion = '2.0' as '1.0';
    invalid.confidence = 2;
    invalid.pages[0].id = 'PAGE-X';
    invalid.pages[0].url = 'not-a-url';
    invalid.pages.push({ ...invalid.pages[0], id: 'PAGE-001' });
    invalid.features.push({ ...invalid.features[0], id: 'FEATURE-002', evidenceIds: ['MISSING'] });
    const validation = validateApplicationIntelligenceSnapshot(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.errors.join('|')).toContain('invalid schemaVersion');
    expect(validation.errors.join('|')).toContain('between 0 and 1');
    expect(validation.errors.join('|')).toContain('missing evidence');
  });

  it('reports truncation when configured limits are exceeded', () => {
    const result = buildApplicationIntelligenceSnapshot(
      { projectId: 'project-1', sourceExecutionId: 'execution-1', metadata, understanding },
      { maxPages: 1, maxFeatures: 0, maxWorkflows: 0, maxRoles: 0, maxRisks: 0, maxEvidence: 10, maxStringLength: 500, maxSnapshotBytes: 200000 },
    );
    expect(result.truncated).toBe(true);
    expect(result.truncation?.entities).toContain('features');
  });
});