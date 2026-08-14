import type { ExecutionContext, ITool, ToolInputSchema, ToolOutputSchema, ToolResult, ToolId } from '@testpilot/contracts';
/**
 * Base class for all tools
 * Implements the ITool interface with common lifecycle management
 */
export declare abstract class BaseTool implements ITool {
    readonly id: ToolId;
    readonly name: string;
    readonly description: string;
    readonly inputSchema: ToolInputSchema;
    readonly outputSchema: ToolOutputSchema;
    protected isInitialized: boolean;
    constructor(id: ToolId, name: string, description: string, inputSchema: ToolInputSchema, outputSchema: ToolOutputSchema);
    /**
     * Initialize tool resources before first use
     */
    initialize(): Promise<void>;
    /**
     * Override in subclass to perform initialization
     */
    protected onInitialize(): Promise<void>;
    /**
     * Execute the tool
     */
    abstract execute<T = unknown>(input: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult<T>>;
    /**
     * Cleanup any resources
     */
    cleanup(): Promise<void>;
    /**
     * Override in subclass to perform cleanup
     */
    protected onCleanup(): Promise<void>;
    /**
     * Helper to create a successful tool result
     */
    protected createSuccessResult<T>(output: T, duration: number): ToolResult<T>;
    /**
     * Helper to create a failed tool result
     */
    protected createErrorResult(code: string, message: string, details?: unknown, duration?: number): ToolResult;
}
//# sourceMappingURL=base-tool.d.ts.map