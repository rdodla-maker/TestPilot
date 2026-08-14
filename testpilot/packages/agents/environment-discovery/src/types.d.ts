/**
 * Types for EnvironmentDiscoveryAgent
 */
import type { AgentInput } from '@testpilot/contracts';
/**
 * Input to environment discovery agent
 */
export interface EnvironmentDiscoveryInput extends AgentInput {
    projectId: string;
    url: string;
    timeout?: number;
}
/**
 * Discovered environment details
 */
export interface EnvironmentObservation {
    projectId: string;
    requestedUrl: string;
    finalUrl: string;
    title: string;
    browserInfo: {
        name: string;
        version: string;
        headless: boolean;
    };
    viewport: {
        width: number;
        height: number;
    };
    html: string;
    screenshot: {
        path: string;
    };
    navigationStatus?: {
        status: number;
        statusText: string;
    };
    loadDuration: number;
    timestamp: Date;
}
/**
 * Agent output
 */
export interface EnvironmentDiscoveryOutput {
    status: 'success' | 'failure';
    observation?: EnvironmentObservation;
    error?: {
        code: string;
        message: string;
    };
    metadata: {
        executionTime: number;
        toolsUsed: string[];
    };
}
//# sourceMappingURL=types.d.ts.map