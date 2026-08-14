import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResultStatus, createExecutionId, createProjectId } from '@testpilot/contracts';
import { Logger } from '@testpilot/observability';
import type { ExecutionContext } from '@testpilot/contracts';
import { ApplicationProfileService, InMemoryProfileRepository } from '@testpilot/database';

const metadata = {
  page: { title: 'Test App', url: 'https://example.com' },
  headings: [], links: [], buttons: [], inputs: [], forms: [], selects: [], textareas: [], images: [], navigation: [],
  summary: { links: 0, buttons: 0, inputs: 0, forms: 0, selects: 0, textareas: 0, images: 0, headings: 0, navigationRegions: 0 },
};

vi.mock('@testpilot/agents-environment-discovery', () => ({
  EnvironmentDiscoveryAgent: class {
    async execute() {
      return { status: ResultStatus.Success, data: { status: 'success', applicationMetadata: metadata, observation: { projectId: 'project-1' } } };
    }
  },
}));

vi.mock('@testpilot/agents-application-understanding', async () => {
  const actual = await vi.importActual<typeof import('@testpilot/agents-application-understanding')>('@testpilot/agents-application-understanding');
  return {
    ...actual,
    ApplicationUnderstandingAgent: class {
      async execute() {
        return {
          status: ResultStatus.Success,
          data: {
            status: 'success',
            result: {
              applicationType: { value: 'web', evidence: [{ id: 'EV-001', text: 'web' }] },
              applicationPurpose: { value: 'test', evidence: [{ id: 'EV-001', text: 'test' }] },
              evidence: [{ id: 'EV-001', text: 'web test' }],
              confidence: 0.8,
            },
          },
        };
      }
    },
  };
});

describe('EnvironmentDiscoveryWorkflow intelligence integration', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = {
      executionId: createExecutionId('execution-1'),
      projectId: createProjectId('project-1'),
      logger: new Logger('error', 'text'),
      config: {},
    };
  });

  it('transforms Level 1.3 understanding into a validated snapshot', async () => {
    const { EnvironmentDiscoveryWorkflow } = await import('./environment-discovery-workflow');
    const profileService = new ApplicationProfileService(new InMemoryProfileRepository());
    const result = await new EnvironmentDiscoveryWorkflow(profileService).execute({ projectId: 'project-1', url: 'https://example.com' }, context);

    expect(result.status).toBe(ResultStatus.Success);
    expect(result.data?.intelligence.schemaVersion).toBe('1.0');
    expect(result.data?.intelligence.sourceExecutionId).toBe('execution-1');
    expect(result.data?.intelligence.application.id).toBe('APP-001');
    expect(result.data?.persistence?.status).toBe('persisted');
    expect(result.data?.persistence?.snapshotVersion).toBe(1);
  });
});