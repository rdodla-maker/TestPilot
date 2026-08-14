import type { ExecutionContext } from './execution-context';
import type { AgentId, ResultStatus } from './types';
/**
 * Input to an agent - generic typed input
 */
export interface AgentInput {
    [key: string]: unknown;
}
/**
 * Result returned by an agent
 */
export interface AgentResult<T = unknown> {
    /**
     * Execution succeeded or failed
     */
    status: ResultStatus;
    /**
     * Main output data
     */
    data?: T;
    /**
     * Error if status is Failed
     */
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    /**
     * Metadata about execution
     */
    metadata: {
        startTime: Date;
        endTime: Date;
        duration: number;
        executionId: string;
        [key: string]: unknown;
    };
}
/**
 * Generic agent contract
 * Every agent must implement this interface
 */
export interface IAgent<Input extends AgentInput = AgentInput, Output = unknown> {
    /**
     * Unique identifier for this agent
     */
    id: AgentId;
    /**
     * Human-readable name
     */
    name: string;
    /**
     * Detailed description of agent's purpose
     */
    description: string;
    /**
     * Execute the agent with given input
     */
    execute(input: Input, context: ExecutionContext): Promise<AgentResult<Output>>;
}
//# sourceMappingURL=agent.d.ts.map