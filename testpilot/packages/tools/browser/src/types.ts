/**
 * Types for BrowserTool
 */

/**
 * Browser navigation result
 */
export interface NavigationResult {
  status: number;
  statusText: string;
  url: string;
}

/**
 * Page observation from browser
 */
export interface PageObservation {
  requestedUrl: string;
  finalUrl: string;
  title: string;
  viewport: {
    width: number;
    height: number;
  };
  html: string;
  screenshot: {
    path: string;
    base64?: string;
  };
  navigationStatus?: NavigationResult;
  loadDuration: number;
  timestamp: Date;
}

/**
 * Browser tool input
 */
export interface BrowserToolInput {
  url: string;
  timeout?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  captureScreenshot?: boolean;
  captureHtml?: boolean;
}

/**
 * Browser tool output
 */
export interface BrowserToolOutput {
  observation: PageObservation;
  warnings?: string[];
}
