import type { IAgent, AgentInput, ITool, IWorkflow, WorkflowInput } from '@testpilot/contracts';

/**
 * Central registry for agents, tools, and workflows
 * Supports discovery and lookup of components
 */
export class Registry {
  private agents: Map<string, IAgent<any, any>> = new Map();
  private tools: Map<string, ITool> = new Map();
  private workflows: Map<string, IWorkflow<any, any>> = new Map();

  /**
   * Register an agent
   */
  registerAgent(agent: IAgent<any, any>): void {
    if (this.agents.has(agent.id as any)) {
      throw new Error(`Agent with id ${agent.id} already registered`);
    }
    this.agents.set(agent.id as any, agent);
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): IAgent<any, any> | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAllAgents(): IAgent<any, any>[] {
    return Array.from(this.agents.values());
  }

  /**
   * Register a tool
   */
  registerTool(tool: ITool): void {
    if (this.tools.has(tool.id as any)) {
      throw new Error(`Tool with id ${tool.id} already registered`);
    }
    this.tools.set(tool.id as any, tool);
  }

  /**
   * Get tool by ID
   */
  getTool(id: string): ITool | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all tools
   */
  getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: IWorkflow<any, any>): void {
    if (this.workflows.has(workflow.id as any)) {
      throw new Error(`Workflow with id ${workflow.id} already registered`);
    }
    this.workflows.set(workflow.id as any, workflow);
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(id: string): IWorkflow<any, any> | undefined {
    return this.workflows.get(id);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): IWorkflow<any, any>[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.agents.clear();
    this.tools.clear();
    this.workflows.clear();
  }
}

/**
 * Global registry instance
 */
let globalRegistry: Registry | null = null;

/**
 * Get or create global registry
 */
export function getGlobalRegistry(): Registry {
  if (!globalRegistry) {
    globalRegistry = new Registry();
  }
  return globalRegistry;
}
