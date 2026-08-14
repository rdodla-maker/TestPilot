import type {
  ExecutionContext,
  ITool,
  ToolInputSchema,
  ToolOutputSchema,
  ToolResult,
  ToolId,
} from '@testpilot/contracts';

/**
 * Base class for all tools
 * Implements the ITool interface with common lifecycle management
 */
export abstract class BaseTool implements ITool {
  readonly id: ToolId;
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ToolInputSchema;
  readonly outputSchema: ToolOutputSchema;

  protected isInitialized = false;

  constructor(
    id: ToolId,
    name: string,
    description: string,
    inputSchema: ToolInputSchema,
    outputSchema: ToolOutputSchema
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
    this.outputSchema = outputSchema;
  }

  /**
   * Initialize tool resources before first use
   */
  async initialize(): Promise<void> {
    console.info(JSON.stringify({
      event: 'tool.initialize.start',
      tool: this.id,
      name: this.name,
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString(),
    }));

    if (!this.isInitialized) {
      await this.onInitialize();
      this.isInitialized = true;
    }

    console.info(JSON.stringify({
      event: 'tool.initialize.end',
      tool: this.id,
      name: this.name,
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Override in subclass to perform initialization
   */
  protected async onInitialize(): Promise<void> {
    // Default: no initialization needed
  }

  /**
   * Execute the tool
   */
  abstract execute<T = unknown>(
    input: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ToolResult<T>>;

  /**
   * Cleanup any resources
   */
  async cleanup(): Promise<void> {
    console.info(JSON.stringify({
      event: 'tool.cleanup.start',
      tool: this.id,
      name: this.name,
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString(),
    }));

    await this.onCleanup();
    this.isInitialized = false;

    console.info(JSON.stringify({
      event: 'tool.cleanup.end',
      tool: this.id,
      name: this.name,
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Override in subclass to perform cleanup
   */
  protected async onCleanup(): Promise<void> {
    // Default: no cleanup needed
  }

  /**
   * Helper to create a successful tool result
   */
  protected createSuccessResult<T>(output: T, duration: number): ToolResult<T> {
    return {
      success: true,
      output,
      duration,
      timestamp: new Date(),
    };
  }

  /**
   * Helper to create a failed tool result
   */
  protected createErrorResult(
    code: string,
    message: string,
    details?: unknown,
    duration?: number
  ): ToolResult {
    return {
      success: false,
      error: { code, message, details },
      duration: duration ?? 0,
      timestamp: new Date(),
    };
  }
}
