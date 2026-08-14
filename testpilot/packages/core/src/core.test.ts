import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseAgent, BaseWorkflow } from '../src';
import type { ExecutionContext, AgentInput } from '@testpilot/contracts';
import { createExecutionId, createProjectId, createWorkflowId, createAgentId } from '@testpilot/contracts';
import { Logger } from '@testpilot/observability';

describe('BaseAgent', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = {
      executionId: createExecutionId('test-exec'),
      projectId: createProjectId('test-proj'),
      logger: new Logger('info', 'text'),
      config: {},
    };
  });

  it('should execute successfully', async () => {
    class TestAgent extends BaseAgent<{ value: string }, string> {
      protected async onExecute(input: { value: string }): Promise<string> {
        return input.value.toUpperCase();
      }
    }

    const agent = new TestAgent(createAgentId('test-agent'), 'Test Agent', 'Test description');
    const result = await agent.execute({ value: 'hello' }, context);

    expect(result.status).toBe('success');
    expect(result.data).toBe('HELLO');
    expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
  });

  it('should handle execution failure', async () => {
    class FailingAgent extends BaseAgent<AgentInput, string> {
      protected async onExecute(): Promise<string> {
        throw new Error('Test error');
      }
    }

    const agent = new FailingAgent(createAgentId('failing-agent'), 'Failing Agent', 'Fails');
    const result = await agent.execute({}, context);

    expect(result.status).toBe('failed');
    expect(result.error?.message).toContain('Test error');
  });

  it('should handle cancellation', async () => {
    const abortController = new AbortController();
    const cancelContext: ExecutionContext = {
      ...context,
      cancellationToken: abortController.signal,
    };

    class CancellableAgent extends BaseAgent<AgentInput, string> {
      protected async onExecute(): Promise<string> {
        return 'should not execute';
      }
    }

    abortController.abort();
    const agent = new CancellableAgent(createAgentId('cancel-agent'), 'Cancel Agent', 'Cancellable');
    const result = await agent.execute({}, cancelContext);

    expect(result.status).toBe('cancelled');
  });
});

describe('BaseWorkflow', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = {
      executionId: createExecutionId('test-exec'),
      projectId: createProjectId('test-proj'),
      logger: new Logger('info', 'text'),
      config: {},
    };
  });

  it('should execute workflow successfully', async () => {
    class TestWorkflow extends BaseWorkflow<{ input: string }, string> {
      protected async onExecute(input: { input: string }): Promise<string> {
        return `processed: ${input.input}`;
      }
    }

    const workflow = new TestWorkflow(createWorkflowId('test-workflow'), 'Test Workflow', 'Test');
    const result = await workflow.execute({ input: 'data' }, context);

    expect(result.status).toBe('success');
    expect(result.data).toBe('processed: data');
    expect(result.metadata.steps).toBeDefined();
  });
});
