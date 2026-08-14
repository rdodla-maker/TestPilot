import type { IWorkflow, WorkflowInput, WorkflowResult, ExecutionContext, ILogger } from '@testpilot/contracts';
import { createExecutionId, createProjectId, createWorkflowId } from '@testpilot/contracts';
import { createLogger } from '@testpilot/observability';
import { createExecutionConfig } from '@testpilot/config';
import { loadConfig } from '@testpilot/config';

/**
 * Execution request for the orchestrator
 */
export interface ExecutionRequest<T extends WorkflowInput = WorkflowInput> {
  projectId: string;
  workflowId: string;
  input: T;
  config?: Partial<any>;
}

/**
 * Execution result from the orchestrator
 */
export interface ExecutionResponse<T = unknown> {
  executionId: string;
  projectId: string;
  workflowId: string;
  result: WorkflowResult<T>;
  duration: number;
}

/**
 * Minimal Orchestrator
 * Responsible for executing workflows with proper context and lifecycle management
 */
export class Orchestrator {
  private logger: ILogger;
  private appConfig: any;

  constructor(logger?: ILogger) {
    this.logger = logger || createLogger('info', 'json');
    this.appConfig = loadConfig();
  }

  /**
   * Execute a workflow
   */
  async execute<T extends WorkflowInput = WorkflowInput, R = unknown>(
    workflow: IWorkflow<T, R>,
    request: ExecutionRequest<T>
  ): Promise<ExecutionResponse<R>> {
    const executionId = createExecutionId(`exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
    const projectId = createProjectId(request.projectId);
    const workflowId = createWorkflowId(request.workflowId);

    const startTime = Date.now();

    this.logger.info('Orchestrator execution started', {
      executionId,
      projectId: request.projectId,
      workflowId: request.workflowId,
    });

    console.info(JSON.stringify({ event: 'orchestrator.start', executionId, projectId: request.projectId, workflowId: request.workflowId, timestamp: new Date().toISOString() }));

    try {
      // Create execution context
      const context: ExecutionContext = {
        executionId,
        projectId,
        workflowId,
        goal: `Execute ${workflow.name}`,
        config: createExecutionConfig(this.appConfig),
        logger: this.logger,
        metadata: request.config,
      };

      // Execute workflow
      console.info(JSON.stringify({ event: 'orchestrator.invoke.workflow', executionId, workflow: workflow.name, projectId: request.projectId, timestamp: new Date().toISOString() }));
      const result = await workflow.execute(request.input, context);
      console.info(JSON.stringify({ event: 'orchestrator.workflow.completed', executionId, workflow: workflow.name, status: result?.status, timestamp: new Date().toISOString() }));

      const duration = Date.now() - startTime;

      this.logger.info('Orchestrator execution completed', {
        executionId,
        projectId: request.projectId,
        status: result.status,
        duration,
      });

      return {
        executionId,
        projectId: request.projectId,
        workflowId: request.workflowId,
        result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('Orchestrator execution failed', error as Error, {
        executionId,
        projectId: request.projectId,
        duration,
      });

      throw error;
    }
  }
}
