import type { ExecutionContext, IAgent, AgentInput, AgentResult, AgentId } from '@testpilot/contracts';
/**
 * Base class for all agents
 * Implements the IAgent interface with common lifecycle and result management
 */
export declare abstract class BaseAgent<Input extends AgentInput = AgentInput, Output = unknown> implements IAgent<Input, Output> {
    readonly id: AgentId;
    readonly name: string;
    readonly description: string;
    constructor(id: AgentId, name: string, description: string);
    /**
     * Execute the agent
     */
    execute(input: Input, context: ExecutionContext): Promise<AgentResult<Output>>;
    /**
     * Override in subclass to implement agent logic
     */
    protected abstract onExecute(input: Input, context: ExecutionContext): Promise<Output>;
    /**
     * Helper to create a successful result
     */
    protected createSuccessResult(output: Output, startTime: Date, endTime: Date): AgentResult<Output>;
    /**
     * Helper to create an error result
     */
    protected createErrorResult(error: Error, startTime: Date, endTime: Date): AgentResult<Output>;
    /**
     * Helper to create a cancelled result
     */
    protected createCancelledResult(startTime: Date): AgentResult<Output>;
}
//# sourceMappingURL=base-agent.d.ts.map