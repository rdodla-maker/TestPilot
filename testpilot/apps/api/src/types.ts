/**
 * API request/response types
 */

/**
 * Standard API response envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    executionId?: string;
    duration?: number;
  };
}

/**
 * Environment Discovery API request
 */
export interface EnvironmentDiscoveryRequest {
  url: string;
  timeout?: number;
}

/**
 * Environment Discovery API response
 */
export interface EnvironmentDiscoveryApiResponse {
  projectId: string;
  executionId: string;
  status: string;
  observation?: {
    requestedUrl: string;
    finalUrl: string;
    title: string;
    viewport: {
      width: number;
      height: number;
    };
    screenshot: {
      path: string;
    };
    navigationStatus?: {
      status: number;
      statusText: string;
    };
    loadDuration: number;
    timestamp: string;
  };
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    executionTime: number;
    toolsUsed: string[];
  };
}
