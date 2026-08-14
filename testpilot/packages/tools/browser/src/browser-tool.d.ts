import { BaseTool } from '@testpilot/core';
import type { ExecutionContext, ToolResult } from '@testpilot/contracts';
import type { BrowserToolOutput } from './types';
/**
 * Browser tool for web observation
 * Handles launching browser, navigating to URLs, and capturing page evidence
 */
export declare class BrowserTool extends BaseTool {
    private browser;
    private context;
    constructor();
    protected onInitialize(): Promise<void>;
    protected onCleanup(): Promise<void>;
    execute<T = BrowserToolOutput>(input: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult<T>>;
    private validateInput;
    private observePage;
}
//# sourceMappingURL=browser-tool.d.ts.map