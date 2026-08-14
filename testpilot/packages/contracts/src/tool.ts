import type { ExecutionContext } from './execution-context';
import type { ToolId } from './types';

/**
 * Input schema for a tool - describes what the tool accepts
 */
export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, ToolSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Individual property in a tool schema
 */
export interface ToolSchemaProperty {
  type: string;
  description: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  items?: ToolSchemaProperty;
  default?: unknown;
}

/**
 * Output schema for a tool - describes what the tool returns
 */
export interface ToolOutputSchema {
  type: string;
  description: string;
  properties?: Record<string, ToolSchemaProperty>;
  items?: ToolSchemaProperty;
}

/**
 * Result returned by tool execution
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  output?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  duration: number;
  timestamp: Date;
}

/**
 * Generic tool contract
 * Every tool must implement this interface
 */
export interface ITool {
  /**
   * Unique identifier for this tool
   */
  id: ToolId;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Detailed description of what the tool does
   */
  description: string;

  /**
   * Input schema for validation
   */
  inputSchema: ToolInputSchema;

  /**
   * Output schema for documentation
   */
  outputSchema: ToolOutputSchema;

  /**
   * Execute the tool with given input
   */
  execute<T = unknown>(
    input: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ToolResult<T>>;

  /**
   * Optional: cleanup any resources
   */
  cleanup?(): Promise<void>;
}
