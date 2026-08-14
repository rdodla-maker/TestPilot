import type { ExecutionId, ExecutionStatus, AgentId, ToolId } from './types';

/**
 * Base event type
 */
export interface ExecutionEvent {
  type: string;
  timestamp: Date;
  executionId: ExecutionId;
  [key: string]: unknown;
}

/**
 * Execution lifecycle events
 */
export interface ExecutionStartedEvent extends ExecutionEvent {
  type: 'execution:started';
  goal?: string;
}

export interface ExecutionCompletedEvent extends ExecutionEvent {
  type: 'execution:completed';
  status: ExecutionStatus;
  duration: number;
}

export interface ExecutionFailedEvent extends ExecutionEvent {
  type: 'execution:failed';
  error: {
    code: string;
    message: string;
  };
  duration: number;
}

/**
 * Agent lifecycle events
 */
export interface AgentStartedEvent extends ExecutionEvent {
  type: 'agent:started';
  agentId: AgentId;
  agentName: string;
}

export interface AgentCompletedEvent extends ExecutionEvent {
  type: 'agent:completed';
  agentId: AgentId;
  agentName: string;
  status: ExecutionStatus;
  duration: number;
}

export interface AgentFailedEvent extends ExecutionEvent {
  type: 'agent:failed';
  agentId: AgentId;
  agentName: string;
  error: {
    code: string;
    message: string;
  };
  duration: number;
}

/**
 * Tool lifecycle events
 */
export interface ToolStartedEvent extends ExecutionEvent {
  type: 'tool:started';
  toolId: ToolId;
  toolName: string;
  input?: Record<string, unknown>;
}

export interface ToolCompletedEvent extends ExecutionEvent {
  type: 'tool:completed';
  toolId: ToolId;
  toolName: string;
  status: ExecutionStatus;
  duration: number;
  output?: unknown;
}

export interface ToolFailedEvent extends ExecutionEvent {
  type: 'tool:failed';
  toolId: ToolId;
  toolName: string;
  error: {
    code: string;
    message: string;
  };
  duration: number;
}

/**
 * Union type of all execution events
 */
export type Event =
  | ExecutionStartedEvent
  | ExecutionCompletedEvent
  | ExecutionFailedEvent
  | AgentStartedEvent
  | AgentCompletedEvent
  | AgentFailedEvent
  | ToolStartedEvent
  | ToolCompletedEvent
  | ToolFailedEvent;

/**
 * Event emitter interface
 */
export interface IEventEmitter {
  emit(event: Event): void;
  on(type: string, handler: (event: Event) => void): void;
  off(type: string, handler: (event: Event) => void): void;
}
