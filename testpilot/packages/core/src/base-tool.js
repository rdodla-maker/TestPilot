/**
 * Base class for all tools
 * Implements the ITool interface with common lifecycle management
 */
export class BaseTool {
    id;
    name;
    description;
    inputSchema;
    outputSchema;
    isInitialized = false;
    constructor(id, name, description, inputSchema, outputSchema) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.inputSchema = inputSchema;
        this.outputSchema = outputSchema;
    }
    /**
     * Initialize tool resources before first use
     */
    async initialize() {
        if (!this.isInitialized) {
            await this.onInitialize();
            this.isInitialized = true;
        }
    }
    /**
     * Override in subclass to perform initialization
     */
    async onInitialize() {
        // Default: no initialization needed
    }
    /**
     * Cleanup any resources
     */
    async cleanup() {
        await this.onCleanup();
        this.isInitialized = false;
    }
    /**
     * Override in subclass to perform cleanup
     */
    async onCleanup() {
        // Default: no cleanup needed
    }
    /**
     * Helper to create a successful tool result
     */
    createSuccessResult(output, duration) {
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
    createErrorResult(code, message, details, duration) {
        return {
            success: false,
            error: { code, message, details },
            duration: duration ?? 0,
            timestamp: new Date(),
        };
    }
}
//# sourceMappingURL=base-tool.js.map