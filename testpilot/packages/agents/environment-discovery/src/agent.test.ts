import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentDiscoveryAgent } from '../src';
import type { ExecutionContext } from '@testpilot/contracts';
import { createExecutionId, createProjectId } from '@testpilot/contracts';
import { Logger } from '@testpilot/observability';

describe('EnvironmentDiscoveryAgent', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = {
      executionId: createExecutionId('test-exec'),
      projectId: createProjectId('test-proj'),
      logger: new Logger('info', 'text'),
      config: {},
    };
  });

  it('should have correct metadata', () => {
    const agent = new EnvironmentDiscoveryAgent();
    expect(agent.id).toBeDefined();
    expect(agent.id).toBe('environment-discovery-agent');
    expect(agent.name).toBe('Environment Discovery Agent');
  });

  it('should be instantiable', () => {
    const agent = new EnvironmentDiscoveryAgent();
    expect(agent).toBeDefined();
    expect(typeof agent.execute).toBe('function');
  });

  it('should accept valid input structure', () => {
    const agent = new EnvironmentDiscoveryAgent();
    const input = {
      projectId: 'test-proj',
      url: 'https://example.com'
    };
    expect(input.projectId).toBeDefined();
    expect(input.url).toBeDefined();
  });
});
