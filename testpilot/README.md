# TestPilot - Autonomous QA Engineer

> AI teammate that explores, reasons, tests, verifies, and certifies software quality

## Overview

TestPilot is a production-grade TypeScript monorepo implementing the first phase of an autonomous QA engineering system. This foundation supports future multi-agent orchestration, complex workflow execution, and comprehensive testing automation.

**Level 1.1: Environment Discovery** - The first implemented feature that allows the system to observe and analyze target web applications.

## Architecture

### Principles

- **Contracts-First Design**: All interfaces defined in the contracts package before implementation
- **Layered Dependencies**: Strict hierarchy prevents circular dependencies (Contracts → Core → Tools/Agents → Workflows → Orchestrator → API)
- **Zero-Configuration Default**: All packages ship with sensible defaults; configuration is optional
- **Type-Safe Execution Context**: Every tool/agent/workflow receives a stable ExecutionContext with logging, cancellation, and metadata
- **Observable Execution**: Event emission and structured logging at every layer

### Package Structure

```
testpilot/
├── packages/
│   ├── contracts/          # Type definitions (no logic, no dependencies)
│   ├── core/              # Base classes for agents, tools, workflows
│   ├── config/            # Environment variable handling
│   ├── observability/     # Structured logging
│   ├── registry/          # Component discovery and registration
│   ├── tools/
│   │   └── browser/       # Playwright-based browser automation (observes pages)
│   ├── agents/
│   │   └── environment-discovery/  # Level 1 agent (analyzes environments)
│   └── workflows/         # Orchestrates agents for business tasks
├── apps/
│   ├── api/              # Express HTTP interface (thin adapter layer)
│   └── web/              # Minimal React UI for Level 1 functionality
└── docs/                 # Architecture and implementation guides
```

### Dependency Graph

```
contracts (bottom - zero dependencies)
├── core
├── config
├── observability
├── registry
└── tools/browser
    └── agents/environment-discovery
        └── workflows
            └── orchestrator
                └── apps/api & apps/web
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Chrome/Chromium (automatic installation via Playwright)

### Installation

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Running the System

#### 1. Start the API Server

```bash
# Development mode (auto-restart on file changes)
npm run dev --workspace=@testpilot/api

# Or directly in the apps/api directory
cd apps/api && npm run dev
```

The API will be available at `http://localhost:3000`

#### 2. Start the Web UI (in another terminal)

```bash
# Development mode (auto-reload with Vite)
npm run dev --workspace=testpilot-web

# Or directly in the apps/web directory
cd apps/web && npm run dev
```

The Web UI will open at `http://localhost:3001`

#### 3. Test the Full Flow

```bash
# Using curl (from API terminal)
curl -X POST http://localhost:3000/api/v1/projects/my-project/environment-discovery \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Response (truncated):
{
  "success": true,
  "data": {
    "projectId": "my-project",
    "executionId": "uuid-here",
    "status": "success",
    "observation": {
      "requestedUrl": "https://example.com",
      "finalUrl": "https://www.example.com",
      "title": "Example Domain",
      "viewport": { "width": 1280, "height": 720 },
      "loadDuration": 1234,
      "screenshot": { "path": "/tmp/screenshot.png" },
      "navigationStatus": { "status": 200, "statusText": "OK" }
    },
    "metadata": {
      "executionTime": 2500,
      "toolsUsed": ["BrowserTool"]
    }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "executionId": "uuid-here",
    "duration": 2500
  }
}
```

## API Documentation

### Environment Discovery Endpoint

**POST** `/api/v1/projects/:projectId/environment-discovery`

Triggers environment discovery on a target URL and returns observation data.

#### Request

```json
{
  "url": "https://example.com",
  "timeout": 30000  // Optional, default 30000ms
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "projectId": "string",
    "executionId": "uuid",
    "status": "success|failure",
    "observation": {
      "requestedUrl": "string",
      "finalUrl": "string",
      "title": "string",
      "viewport": { "width": number, "height": number },
      "screenshot": { "path": "string" },
      "navigationStatus": { "status": number, "statusText": "string" },
      "loadDuration": number,
      "timestamp": "ISO8601"
    },
    "error": { "code": "string", "message": "string" },
    "metadata": {
      "executionTime": number,
      "toolsUsed": ["string"]
    }
  },
  "meta": {
    "timestamp": "ISO8601",
    "executionId": "uuid",
    "duration": number
  }
}
```

#### Status Codes

- **200**: Success (check `data.status` for execution outcome)
- **400**: Invalid request (missing required fields, invalid URL format)
- **404**: Route not found
- **500**: Internal server error

## Development

### Project Structure

Each package is self-contained with:
- `src/` - TypeScript source code
- `src/*.test.ts` - Vitest unit tests
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Building

```bash
# Build all packages
npm run build

# Build a specific package
npm run build --workspace=@testpilot/contracts

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests for a specific package
npm run test -- --workspace=@testpilot/core

# Run with coverage
npm run test -- --coverage
```

### Code Quality

```bash
# Run linter
npm run lint

# Format code
npm run format
```

## Key Concepts

### ExecutionContext

Every agent/tool/workflow execution receives an `ExecutionContext`:

```typescript
interface ExecutionContext {
  executionId: ExecutionId;      // Unique ID for this execution
  projectId: ProjectId;          // The project being tested
  workflowId?: WorkflowId;       // The workflow being executed
  goal?: string;                 // Human-readable goal
  logger: ILogger;               // Structured logging
  config?: Record<string, any>;  // Execution-specific config
  cancellationToken?: AbortSignal; // For graceful cancellation
  metadata?: Record<string, any>;  // Arbitrary metadata
}
```

### Tool Interface

Tools are atomic reusable operations (e.g., `BrowserTool`):

```typescript
interface ITool<Input, Output> {
  id: ToolId;
  name: string;
  execute(input: Input, context: ExecutionContext): Promise<ToolResult<Output>>;
}
```

### Agent Interface

Agents coordinate tools to achieve a goal (e.g., `EnvironmentDiscoveryAgent`):

```typescript
interface IAgent<Input, Output> {
  id: AgentId;
  name: string;
  execute(input: Input, context: ExecutionContext): Promise<AgentResult<Output>>;
}
```

### Workflow Interface

Workflows orchestrate agents for business processes:

```typescript
interface IWorkflow<Input, Output> {
  id: WorkflowId;
  name: string;
  execute(input: Input, context: ExecutionContext): Promise<WorkflowResult<Output>>;
}
```

## Configuration

Environment variables (defaults provided):

```bash
# Browser Configuration
BROWSER_HEADLESS=true              # Run browser in headless mode
BROWSER_TIMEOUT=30000              # Page load timeout (ms)
BROWSER_VIEWPORT_WIDTH=1280        # Browser viewport width
BROWSER_VIEWPORT_HEIGHT=720        # Browser viewport height

# Orchestrator Configuration
ORCHESTRATOR_TIMEOUT=60000         # Workflow execution timeout (ms)
ORCHESTRATOR_MAX_RETRIES=3         # Max retries on failure

# API Configuration
API_HOST=localhost                 # API server host
API_PORT=3000                      # API server port
API_CORS_ORIGINS=http://localhost:3001  # CORS origins (comma-separated)

# Logging Configuration
LOG_LEVEL=info                     # Log level (debug, info, warn, error)
LOG_FORMAT=text                    # Log format (text, json)

# Application
NODE_ENV=development               # Environment
```

## Implementation Details

### Level 1.1: Environment Discovery

This phase implements the minimum viable architecture for autonomous testing:

1. **BrowserTool** - Observes web pages using Playwright
   - Navigates to URL
   - Captures title, HTML, screenshot
   - Records navigation status and load duration
   - Handles timeouts and SSL errors

2. **EnvironmentDiscoveryAgent** - Coordinates browser observations
   - Validates input (projectId, URL)
   - Invokes BrowserTool
   - Returns structured observation

3. **EnvironmentDiscoveryWorkflow** - Orchestrates agents
   - Instantiates EnvironmentDiscoveryAgent
   - Executes with ExecutionContext
   - Returns results with metadata

4. **Orchestrator** - Minimal execution engine
   - Creates ExecutionContext
   - Invokes workflow
   - Times execution and captures results

5. **Express API** - HTTP adapter
   - POST /api/v1/projects/:projectId/environment-discovery
   - Request validation
   - Response envelope

6. **React Web UI** - Minimal Level 1 interface
   - URL input
   - Start discovery button
   - Results display (title, screenshot, metadata)
   - Error display

### Error Handling

Comprehensive error hierarchy for different failure modes:

```
ApplicationError (base)
├── ValidationError           (InvalidInput)
├── BrowserError             (BrowserLaunchFailed, NavigationTimeout, etc.)
├── AgentError               (AgentExecutionFailed)
├── WorkflowError            (WorkflowExecutionFailed)
└── OrchestratorError        (OrchestratorExecutionFailed)
```

Each error includes:
- **code**: Machine-readable ErrorCode enum
- **message**: Human-readable description
- **details**: Optional object with additional context

## Known Limitations

1. **Single URL per Execution**: EnvironmentDiscoveryAgent processes one URL at a time
2. **No Authentication**: BrowserTool cannot handle login flows yet
3. **Basic Screenshot Only**: Screenshots are full-page PNG; no video recording
4. **No Multi-Tab Support**: Workflows cannot coordinate multiple browser tabs
5. **No State Persistence**: Results are in-memory; no database integration
6. **Synchronous Execution**: No parallel workflow execution yet
7. **Limited Error Recovery**: No built-in retry logic for failed navigation
8. **Manual Configuration**: No UI for environment configuration yet

## Next Steps (Level 1.2 and Beyond)

### Level 1.2: Test Discovery

- Implement test pattern detection
- Scan for test files (Jest, Mocha, etc.)
- Extract test metadata (suites, cases, fixtures)
- Create `TestDiscoveryAgent` and `TestDiscoveryWorkflow`

### Level 2: Test Execution

- Execute discovered tests with coverage
- Aggregate results and failures
- Create `TestExecutionAgent`
- Add `/api/v1/projects/:projectId/test-execution` endpoint

### Level 3: AI Reasoning

- Integrate LLM for test generation
- Analyze failures and suggest fixes
- Create `TestAnalysisAgent`
- Add `/api/v1/projects/:projectId/test-analysis` endpoint

### Level 4: Multi-Agent Orchestration

- Support parallel agent execution
- Implement inter-agent communication
- Add workflow composition
- Create meta-workflows

### Level 5: Enterprise Features

- Database persistence
- Authentication and authorization
- Multi-tenancy
- CI/CD integration
- Dashboard and analytics

## Files Created

**Root Configuration** (4 files):
- package.json
- tsconfig.json
- turbo.json
- eslint.config.mjs
- prettier.config.json
- vitest.config.ts

**Packages** (11 packages, ~60 files):
- packages/contracts - 6 files (types, errors, events)
- packages/core - 4 files (base classes)
- packages/config - 1 file (config management)
- packages/observability - 1 file (logger)
- packages/registry - 1 file (service locator)
- packages/tools/browser - 3 files (browser tool)
- packages/agents/environment-discovery - 2 files (agent)
- packages/workflows - 1 file (workflow)
- packages/orchestrator - 1 file (orchestrator)

**Applications** (2 apps, ~20 files):
- apps/api - server.ts, routes.ts, middleware.ts, types.ts
- apps/web - React components, HTML, CSS, Vite config

**Tests** (5 test files):
- packages/contracts/src/contracts.test.ts
- packages/core/src/core.test.ts
- packages/tools/browser/src/browser.test.ts
- packages/agents/environment-discovery/src/agent.test.ts
- (API integration tests not yet implemented)

**Total**: ~80 files

## Dependencies Summary

### Production Dependencies

- **express** ^4.18.2 - Web framework
- **playwright** ^1.40.0 - Browser automation
- **cors** ^2.8.5 - CORS middleware
- **uuid** ^9.0.1 - UUID generation
- **react** ^18.2.0, **react-dom** ^18.2.0 - UI framework

### Development Dependencies

- **typescript** ^5.3.2 - Language
- **vitest** ^1.0.4 - Test framework
- **turbo** ^1.10.16 - Monorepo orchestration
- **eslint** ^8.54.0, **@typescript-eslint/eslint-plugin** - Linting
- **prettier** ^3.1.0 - Code formatting
- **tsx** ^4.7.0 - TypeScript executor
- **vite** ^5.0.8 - Web bundler

## Support & Contributing

For bug reports, feature requests, or contributions, please visit the project repository.

## License

Apache License 2.0
