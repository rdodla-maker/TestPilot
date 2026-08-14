import { BaseTool } from '@testpilot/core';
import { ValidationError, BrowserError, ErrorCode } from '@testpilot/contracts';
import { chromium } from 'playwright';
import { isValidUrl } from './url-validator';
/**
 * Browser tool for web observation
 * Handles launching browser, navigating to URLs, and capturing page evidence
 */
export class BrowserTool extends BaseTool {
    browser = null;
    context = null;
    constructor() {
        const id = 'browser-tool';
        const name = 'Browser Tool';
        const description = 'Navigate to URLs and observe web pages. Captures title, HTML, screenshots, and navigation details.';
        const inputSchema = {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'URL to navigate to',
                },
                timeout: {
                    type: 'number',
                    description: 'Navigation timeout in milliseconds (default: 30000)',
                    default: 30000,
                },
                viewportWidth: {
                    type: 'number',
                    description: 'Browser viewport width (default: 1920)',
                    default: 1920,
                },
                viewportHeight: {
                    type: 'number',
                    description: 'Browser viewport height (default: 1080)',
                    default: 1080,
                },
                captureScreenshot: {
                    type: 'string',
                    description: 'Whether to capture screenshot (default: true)',
                    enum: ['true', 'false'],
                    default: 'true',
                },
                captureHtml: {
                    type: 'string',
                    description: 'Whether to capture HTML (default: true)',
                    enum: ['true', 'false'],
                    default: 'true',
                },
            },
            required: ['url'],
        };
        const outputSchema = {
            type: 'object',
            description: 'Page observation with title, HTML, screenshot, and metadata',
            properties: {
                observation: {
                    type: 'object',
                    description: 'Page observation data',
                },
                warnings: {
                    type: 'array',
                    description: 'Any warnings during observation',
                },
            },
        };
        super(id, name, description, inputSchema, outputSchema);
    }
    async onInitialize() {
        try {
            this.browser = await chromium.launch({ headless: true });
        }
        catch (error) {
            throw new BrowserError(ErrorCode.BrowserLaunchFailed, 'Failed to launch browser', { originalError: error.message });
        }
    }
    async onCleanup() {
        if (this.context) {
            await this.context.close().catch(() => { });
        }
        if (this.browser) {
            await this.browser.close().catch(() => { });
        }
    }
    async execute(input, context) {
        const startTime = Date.now();
        context.logger.debug('BrowserTool execute started', { input });
        try {
            // Initialize if needed
            await this.initialize();
            // Validate input
            const browserInput = this.validateInput(input);
            context.logger.debug('Input validated', { url: browserInput.url });
            // Execute navigation
            const observation = await this.observePage(browserInput, context);
            context.logger.debug('Page observed', { url: observation.finalUrl, title: observation.title });
            const duration = Date.now() - startTime;
            return this.createSuccessResult({ observation }, duration);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            context.logger.error('BrowserTool execute failed', error, { duration });
            if (error instanceof ValidationError || error instanceof BrowserError) {
                return this.createErrorResult(error.code || 'BROWSER_TOOL_ERROR', error.message, error.details, duration);
            }
            return this.createErrorResult('BROWSER_TOOL_ERROR', error.message, undefined, duration);
        }
    }
    validateInput(input) {
        const url = input.url;
        if (typeof url !== 'string' || !url) {
            throw new ValidationError('URL is required and must be a non-empty string');
        }
        if (!isValidUrl(url)) {
            throw new ValidationError('Invalid URL format', { url });
        }
        return {
            url,
            timeout: typeof input.timeout === 'number' ? input.timeout : 30000,
            viewportWidth: typeof input.viewportWidth === 'number' ? input.viewportWidth : 1920,
            viewportHeight: typeof input.viewportHeight === 'number' ? input.viewportHeight : 1080,
            captureScreenshot: input.captureScreenshot !== 'false',
            captureHtml: input.captureHtml !== 'false',
        };
    }
    async observePage(input, context) {
        if (!this.browser) {
            throw new BrowserError(ErrorCode.BrowserLaunchFailed, 'Browser not initialized');
        }
        let page = null;
        let browserContext = null;
        try {
            // Always create a fresh browser context per observation to avoid stale/closed contexts
            const vpWidth = input.viewportWidth ?? 1920;
            const vpHeight = input.viewportHeight ?? 1080;
            browserContext = await this.browser.newContext({
                viewport: {
                    width: vpWidth,
                    height: vpHeight,
                },
            });
            // Create page
            page = await browserContext.newPage();
            context.logger.debug('Page created');
            // Navigate
            const navigationStartTime = Date.now();
            let navigationStatus = undefined;
            try {
                const response = await page.goto(input.url, {
                    timeout: input.timeout,
                    waitUntil: 'networkidle',
                });
                if (response) {
                    navigationStatus = {
                        status: response.status(),
                        statusText: response.statusText(),
                        url: response.url(),
                    };
                }
            }
            catch (navigationError) {
                const errorMessage = navigationError.message;
                if (errorMessage.includes('timeout')) {
                    throw new BrowserError(ErrorCode.NavigationTimeout, `Navigation timeout after ${input.timeout}ms`, { url: input.url });
                }
                if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || errorMessage.includes('net::ERR_NAME_NOT_RESOLVED')) {
                    throw new BrowserError(ErrorCode.DnsResolutionFailed, `Failed to resolve DNS for ${input.url}`, { url: input.url });
                }
                if (errorMessage.includes('ERR_SSL') || errorMessage.includes('net::ERR_CERT')) {
                    throw new BrowserError(ErrorCode.SslError, `SSL error accessing ${input.url}`, { url: input.url });
                }
                if (errorMessage.includes('Connection refused') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
                    throw new BrowserError(ErrorCode.ConnectionRefused, `Connection refused for ${input.url}`, { url: input.url });
                }
                throw new BrowserError(ErrorCode.NavigationFailed, `Navigation failed: ${errorMessage}`, { url: input.url });
            }
            const loadDuration = Date.now() - navigationStartTime;
            context.logger.debug('Navigation completed', { url: input.url, duration: loadDuration, status: navigationStatus?.status });
            // Capture title
            const title = await page.title();
            context.logger.debug('Title captured', { title });
            // Capture URL
            const finalUrl = page.url();
            // Capture HTML
            let html = '';
            if (input.captureHtml) {
                try {
                    html = await page.content();
                    context.logger.debug('HTML captured', { length: html.length });
                }
                catch (error) {
                    context.logger.warn('Failed to capture HTML', { error: error.message });
                }
            }
            // Capture screenshot
            let screenshotPath = '';
            if (input.captureScreenshot) {
                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    screenshotPath = `/tmp/testpilot-screenshot-${timestamp}.png`;
                    await page.screenshot({ path: screenshotPath, fullPage: false });
                    context.logger.debug('Screenshot captured', { path: screenshotPath });
                }
                catch (error) {
                    context.logger.warn('Failed to capture screenshot', { error: error.message });
                    screenshotPath = '';
                }
            }
            // Get viewport
            const viewport = page.viewportSize();
            if (!viewport) {
                throw new BrowserError(ErrorCode.InternalServerError, 'Failed to get viewport size');
            }
            const actualVpWidth = viewport.width ?? 1280;
            const actualVpHeight = viewport.height ?? 720;
            // Create observation
            const observation = {
                requestedUrl: input.url,
                finalUrl,
                title,
                viewport: {
                    width: actualVpWidth,
                    height: actualVpHeight,
                },
                html,
                screenshot: {
                    path: screenshotPath,
                },
                navigationStatus,
                loadDuration,
                timestamp: new Date(),
            };
            return observation;
        }
        catch (error) {
            if (error instanceof BrowserError) {
                throw error;
            }
            throw new BrowserError(ErrorCode.ToolExecutionFailed, `Browser tool error: ${error.message}`, { originalError: error.message });
        }
        finally {
            if (page) {
                try {
                    await page.close();
                }
                catch (_) {
                    // Ignore
                }
            }
            if (browserContext) {
                try {
                    await browserContext.close();
                }
                catch (_) {
                    // Ignore
                }
            }
        }
    }
}
//# sourceMappingURL=browser-tool.js.map