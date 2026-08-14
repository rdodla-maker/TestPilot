import { ApplicationUnderstandingAgent } from './index';
import { createMockProvider, type AIProvider } from '@testpilot/ai-provider';
import { createLogger } from '@testpilot/observability';
import { isApplicationUnderstandingResult } from './validation';
import { buildApplicationIntelligenceSnapshot } from './intelligence';
import { prepareEvidence } from './index';

const context = { executionId: 'execution-1', logger: createLogger('error', 'json') } as unknown as Parameters<ApplicationUnderstandingAgent['execute']>[1];

const metadata = {
  page: { title: 'Test Page', url: 'https://example.com' },
  headings: [{ level: 1, text: 'Search', normalizedText: 'search' }],
  links: [],
  buttons: [],
  inputs: [],
  forms: [],
  selects: [],
  textareas: [],
  images: [],
  navigation: [],
  summary: { links: 0, buttons: 0, inputs: 0, forms: 0, selects: 0, textareas: 0, images: 0, headings: 1, navigationRegions: 0 },
};

const understanding = {
  applicationType: { value: 'web', evidence: [{ id: 'e1', text: 'page type' }], confidence: 0.8 },
  applicationPurpose: { value: 'demo', evidence: [{ id: 'e2', text: 'page purpose' }], confidence: 0.6 },
  businessDomain: { value: 'unknown', evidence: [] },
  userRoles: [{ role: 'user', evidence: [{ id: 'e3', text: 'user link' }] }],
  features: [{ name: 'search', evidence: [{ id: 'e4', text: 'search input' }] }],
  workflows: [],
  riskAreas: [],
  confidence: 0.6,
  evidence: [
    { id: 'e1', text: 'page type' },
    { id: 'e2', text: 'page purpose' },
    { id: 'e3', text: 'user link' },
    { id: 'e4', text: 'search input' },
  ],
};

it('ApplicationUnderstandingAgent runs with mock provider', async () => {
  const agent = new ApplicationUnderstandingAgent(createMockProvider());
  const input = { projectId: 'p1', applicationMetadata: metadata };

  const res = await agent.execute(input, context);
  expect(res.status).toBe('success');
  expect(res.data?.status).toBe('success');
  expect(isApplicationUnderstandingResult(res.data?.result)).toBe(true);
});

it('prepares bounded, source-labelled evidence', () => {
  const evidence = prepareEvidence(metadata);
  expect(evidence).toEqual([
    { id: 'page', source: 'page', text: JSON.stringify(metadata.page) },
    { id: 'heading-0', source: 'headings[0]', text: JSON.stringify(metadata.headings[0]) },
    { id: 'summary', source: 'summary', text: JSON.stringify(metadata.summary) },
  ]);
});

it('rejects provider output that does not match the contract', async () => {
  const invalidProvider: AIProvider = {
    name: 'invalid',
    async callModel() {
      return { text: JSON.stringify({ confidence: 2, evidence: [] }) };
    },
  };

  const result = await new ApplicationUnderstandingAgent(invalidProvider).execute(
    { projectId: 'p1', applicationMetadata: metadata },
    context,
  );

  expect(result.status).toBe('success');
  expect(result.data?.status).toBe('failed');
  expect(result.data?.error?.message).toBe('Invalid provider schema');
});

it('builds evidence-linked intelligence and high-priority test targets', () => {
  const intelligence = buildApplicationIntelligenceSnapshot({
    projectId: 'p1',
    sourceExecutionId: 'execution-1',
    metadata: {
      ...metadata,
      links: [{ text: 'Dashboard', href: '/dashboard' }],
      inputs: [{ name: 'query', ariaLabel: 'Search' }],
      forms: [{ action: '/search', method: 'get', fieldCount: 1 }],
      navigation: [{ label: 'Main', links: [{ text: 'Dashboard', href: '/dashboard' }] }],
      summary: { ...metadata.summary, links: 1, inputs: 1, forms: 1, navigationRegions: 1 },
    } as any,
    understanding,
  });

  expect(intelligence.schemaVersion).toBe('1.0');
  expect(intelligence.application.id).toBe('APP-001');
  expect(intelligence.pages[0].id).toBe('PAGE-001');
  expect(intelligence.features).toHaveLength(1);
  expect(intelligence.evidence.length).toBeGreaterThan(0);
});
