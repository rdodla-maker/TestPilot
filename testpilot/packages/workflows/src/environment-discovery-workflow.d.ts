import { BaseWorkflow } from '@testpilot/core';
import type { ExecutionContext, WorkflowInput } from '@testpilot/contracts';
import type { EnvironmentDiscoveryOutput } from '@testpilot/agents-environment-discovery';
/**
 * Input to environment discovery workflow
 */
export interface EnvironmentDiscoveryWorkflowInput extends WorkflowInput {
    projectId: string;
    url: string;
    timeout?: number;
}
/**
 * Output from environment discovery workflow
 */
export interface EnvironmentDiscoveryWorkflowOutput {
    projectId: string;
    discovery: EnvironmentDiscoveryOutput;
}
/**
 * Environment Discovery Workflow
 * Orchestrates the environment discovery agent to collect initial application intelligence
 */
export declare class EnvironmentDiscoveryWorkflow extends BaseWorkflow<EnvironmentDiscoveryWorkflowInput, EnvironmentDiscoveryWorkflowOutput> {
    private agent;
    constructor();
    protected onExecute(input: EnvironmentDiscoveryWorkflowInput, context: ExecutionContext): Promise<EnvironmentDiscoveryWorkflowOutput>;
}
//# sourceMappingURL=environment-discovery-workflow.d.ts.map