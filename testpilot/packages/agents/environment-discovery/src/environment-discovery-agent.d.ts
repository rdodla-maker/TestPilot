import { BaseAgent } from '@testpilot/core';
import type { ExecutionContext } from '@testpilot/contracts';
import type { EnvironmentDiscoveryInput, EnvironmentDiscoveryOutput } from './types';
/**
 * Environment Discovery Agent
 * Mission: Observe a target web application and collect reliable raw evidence
 */
export declare class EnvironmentDiscoveryAgent extends BaseAgent<EnvironmentDiscoveryInput, EnvironmentDiscoveryOutput> {
    private browserTool;
    constructor();
    protected onExecute(input: EnvironmentDiscoveryInput, context: ExecutionContext): Promise<EnvironmentDiscoveryOutput>;
}
//# sourceMappingURL=environment-discovery-agent.d.ts.map