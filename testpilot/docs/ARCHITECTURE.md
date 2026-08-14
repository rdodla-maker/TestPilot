# TestPilot Architecture

## Overview

TestPilot is designed as a layered, extensible system for autonomous QA testing. This document details the architecture rationale, design patterns, and implementation guidelines.

## Design Principles

### 1. Contracts-First Design

**Principle**: All interfaces are defined in the `contracts` package before any implementation.

**Rationale**:
- Enables parallel development across different layers
- Provides clear contracts for test mocking and verification
- Prevents implementation-driven design decisions
- Simplifies dependency management

**Implementation**:
- `packages/contracts/src/` contains only interfaces, types, and enums
- Zero business logic; zero external dependencies
- Type definitions for agents, tools, workflows, execution contexts, errors, events
- Type builders (branded types) for IDs to prevent accidental mixing

### 2. Layered Dependency Hierarchy

**Principle**: Dependencies flow downward only; no circular dependencies allowed.

**Hierarchy** (bottom → top):

```
1. contracts         (zero dependencies)
   ↓
2. core, config,     (depend only on contracts)
   observability,
   registry
   ↓
3. tools, agents,    (depend on contracts + core + config + observability)
   workflows
   ↓
4. orchestrator      (coordinates workflows)
   ↓
5. api, web apps     (HTTP/UI adapters)
```

**Rationale**:
- Enables testing lower layers without importing higher layers
- Prevents cyclic imports and build complexity
- Clear separation of concerns
- Facilitates modular development and future splitting

**Enforcement**:
- No imports from `api` into `packages`
- No imports from `apps` into `packages`
- Packages only import from packages below them

### 3. Execution Context as Stable Foundation

**Principle**: Every tool/agent/workflow execution receives an `ExecutionContext` containing logging, cancellation, config, and metadata.

**Why**:
- Eliminates need for global state or dependency injection frameworks
- Enables deterministic testing (pass mock logger and config)
- Supports graceful cancellation via AbortSignal
- Provides distributed tracing via executionId

**Usage**:
```typescript
interface ITool {
  execute<T>(input: Input, context: ExecutionContext): Promise<ToolResult<T>>;
}

// Caller provides context
const context: ExecutionContext = {
  executionId: createExecutionId('unique-id'),
  projectId: createProjectId('project-123'),
  logger: new Logger('info', 'json'),
  config: { timeout: 30000 },
  cancellationToken: abortController.signal,
};

const result = await tool.execute(input, context);
```

### 4. Error Hierarchy

**Principle**: Errors use a domain-specific hierarchy with codes and optional details.

**Hierarchy**:
```
ApplicationError
├── ValidationError         → ErrorCode.InvalidInput
├── BrowserError           → Multiple codes (NavigationTimeout, DnsResolutionFailed, etc.)
├── AgentError             → Multiple codes (AgentExecutionFailed, etc.)
├── WorkflowError          → ErrorCode.WorkflowExecutionFailed
└── OrchestratorError      → ErrorCode.OrchestratorExecutionFailed
```

**Why**:
- Error codes enable client-side error handling logic
- Details field allows arbitrary context (URL, DNS record, etc.)
- Stack traces are captured but separated from error object
- API can serialize cleanly to JSON

**Example**:
```typescript
const error = new BrowserError(
  ErrorCode.DnsResolutionFailed,
  'Failed to resolve example.com',
  { hostname: 'example.com', originalError: dnsError }
);

// Serializes to:
// {
//   code: "DnsResolutionFailed",
//   message: "Failed to resolve example.com",
//   details: { hostname: 'example.com' }
// }
```

### 5. Result Objects (Not Exceptions)

**Principle**: Agents and workflows return `AgentResult<T>` / `WorkflowResult<T>` instead of throwing.

**Structure**:
```typescript
// Success case
{ status: 'success', data: T, metadata: {...} }

// Failure case
{ status: 'failure', error: ApplicationError, metadata: {...} }

// Cancellation
{ status: 'cancelled', error: CancelledError, metadata: {...} }

// Timeout
{ status: 'timeout', error: TimeoutError, metadata: {...} }
```

**Why**:
- Workflows are observed systems; exceptions break observability
- Clients can always check `.status` before accessing `.data`
- Metadata (duration, toolsUsed, etc.) always available
- Distributed tracing systems can log all execution states

### 6. Observable Execution

**Principle**: Events are emitted at every significant lifecycle point.

**Lifecycle Events**:
- ExecutionStartedEvent
- AgentStartedEvent / AgentCompletedEvent / AgentFailedEvent
- ToolStartedEvent / ToolCompletedEvent / ToolFailedEvent
- WorkflowStartedEvent / WorkflowCompletedEvent / WorkflowFailedEvent

**Usage**:
```typescript
orchestrator.on('agent-started', (event) => {
  logger.info(`Agent ${event.agentId} started execution`);
});

orchestrator.on('agent-failed', (event) => {
  logger.error(`Agent ${event.agentId} failed:`, event.error);
});
```

## Package Design

### packages/contracts

**Purpose**: Single source of truth for all interfaces.

**Contents**:
- `types.ts` - Core interfaces (ITool, IAgent, IWorkflow, ExecutionContext)
- `errors.ts` - Error hierarchy and ErrorCode enum
- `events.ts` - Event types for observability
- `execution.ts` - Execution result types
- `id-types.ts` - Branded ID types

**Key Design Decisions**:
- No implementation; interfaces only
- Branded types prevent accidental ID mixing
- Error classes in contracts allow all layers to throw consistently

### packages/core

**Purpose**: Base classes and lifecycle management.

**Contents**:
- `base-tool.ts` - Abstract Tool with lifecycle hooks
- `base-agent.ts` - Abstract Agent with try/catch and logging
- `base-workflow.ts` - Abstract Workflow with step tracking
- `event-emitter.ts` - Simple EventEmitter

**Key Design Decisions**:
- Lifecycle methods (onInitialize, onExecute, onCleanup) separate concerns
- Auto-logging in base classes eliminates boilerplate
- Try/catch in base classes ensures consistent error handling
- Result objects guarantee metadata is always present

### packages/config

**Purpose**: Centralized configuration from environment variables.

**Contents**:
- Single file that exports loadConfig()

**Key Design Decisions**:
- Prevents scattered process.env access throughout codebase
- Default values for all settings
- Single source of truth for config structure
- Exported config is frozen/read-only

### packages/observability

**Purpose**: Structured logging with format support.

**Contents**:
- `logger.ts` - Logger implementation

**Key Design Decisions**:
- Implements ILogger interface from contracts
- Supports text and JSON output
- Log levels: debug, info, warn, error
- Metadata/context objects automatically serialized

### packages/tools/browser

**Purpose**: First concrete tool - browser automation using Playwright.

**Contents**:
- `browser-tool.ts` - Tool implementation
- `url-validator.ts` - URL validation and normalization
- `types.ts` - Tool-specific types

**Key Design Decisions**:
- Pure observation; no AI or testing logic
- Distinguishes different error types (timeout, DNS, SSL, etc.)
- Chromium headless by default
- Screenshot and HTML capture for analysis

### packages/agents/environment-discovery

**Purpose**: First concrete agent - observes target environments.

**Contents**:
- `agent.ts` - Agent implementation
- `types.ts` - Input/output types

**Key Design Decisions**:
- Validates input before calling tool
- Uses BrowserTool to observe pages
- Returns structured observation with metadata
- Handles tool errors gracefully

### packages/workflows

**Purpose**: Orchestrates agents for business processes.

**Contents**:
- `environment-discovery-workflow.ts` - Level 1 workflow

**Key Design Decisions**:
- Thin wrapper that instantiates agent and calls execute
- Used by Orchestrator to run complete feature flows
- Returns projectId + discovery result for API mapping

### packages/orchestrator

**Purpose**: Minimal execution engine for workflows.

**Contents**:
- `orchestrator.ts` - Execution coordinator

**Key Design Decisions**:
- Creates ExecutionContext with unique IDs
- Times execution and captures duration
- Passes config and logger from ExecutionRequest
- Used by API to run workflows

## Execution Flow

```
User Request (API)
       ↓
POST /api/v1/projects/:projectId/environment-discovery
  {url, timeout}
       ↓
API Handler (apps/api/src/routes.ts)
  - Validates request
  - Creates ExecutionRequest
  - Instantiates Orchestrator
       ↓
Orchestrator.execute(workflow, request)
  - Creates ExecutionContext
  - Calls workflow.execute(input, context)
       ↓
EnvironmentDiscoveryWorkflow.execute()
  - Instantiates EnvironmentDiscoveryAgent
  - Calls agent.execute(input, context)
       ↓
EnvironmentDiscoveryAgent.onExecute()
  - Validates input (projectId, URL)
  - Instantiates BrowserTool
  - Calls tool.execute(input, context)
  - Returns AgentResult with observation
       ↓
BrowserTool.onExecute()
  - Validates URL format
  - Launches browser
  - Navigates to URL
  - Captures page data
  - Returns ToolResult with PageObservation
       ↓
Results propagate back up
       ↓
API Handler maps to EnvironmentDiscoveryApiResponse
       ↓
HTTP 200 + JSON response to client
```

## Error Handling Flow

```
BrowserTool.navigate(url)
  ↓ Navigation fails (timeout)
  ↓
throw new BrowserError(
  ErrorCode.NavigationTimeout,
  'Failed to navigate within 30s'
)
  ↓
EnvironmentDiscoveryAgent.onExecute() catch block
  ↓ Logs error, wraps in AgentError
  ↓
BaseAgent.execute() catches and creates AgentResult
  ↓ { status: 'failure', error: {...}, metadata: {...} }
  ↓
EnvironmentDiscoveryWorkflow receives result
  ↓ Returns it as is
  ↓
Orchestrator receives result
  ↓ Returns ExecutionResponse with result
  ↓
API Handler receives result
  ↓
Maps to ApiResponse { success: false, error: {...} }
  ↓
HTTP 200 + error details to client
```

## Testing Strategy

### Unit Tests

Each package has corresponding `.test.ts` files:
- Contracts: Type validation, error serialization
- Core: Lifecycle hooks, error handling, cancellation
- Tools: Input validation, output format, error cases
- Agents: Input validation, tool coordination, error mapping
- Workflows: Orchestration, result transformation

### Integration Tests

(Not yet implemented)
- API endpoint tests with mock tools
- End-to-end tests with real browser
- Error recovery scenarios

### Test Approach

```typescript
// Unit test example
it('should handle navigation timeout', async () => {
  const tool = new BrowserTool();
  const mockBrowser = { /* mock implementation */ };
  
  const result = await tool.execute(
    { url: 'https://example.com', timeout: 100 },
    { logger: mockLogger, ... }
  );
  
  expect(result.status).toBe('failure');
  expect(result.error.code).toBe(ErrorCode.NavigationTimeout);
});
```

## Future Architecture (Not Implemented)

### Level 2: Multi-Agent Orchestration

- Agent communication protocol
- Workflow DAG execution
- Parallel agent execution
- Inter-agent result passing

### Level 3: State Management

- Execution history persistence
- Workflow checkpoint/restore
- Long-running workflow support

### Level 4: Enterprise Features

- Authentication at API layer
- Multi-tenancy in data models
- Rate limiting and quotas
- Database integration

## Design Trade-offs

### Why Result Objects Instead of Exceptions?

**Chosen**: Result objects (AgentResult, WorkflowResult)
- Pro: Explicit error handling; observability; no exception unwinding
- Con: Verbose .status checks; requires discipline

**Alternative**: Exceptions
- Pro: Concise; familiar to most developers
- Con: Breaks observability; exception unwinding hides flow; harder to trace

### Why No Dependency Injection?

**Chosen**: ExecutionContext parameter
- Pro: Explicit dependencies; testable; no magic; clear flow
- Con: More verbose than DI framework; repeated parameter passing

**Alternative**: DI Framework (InversifyJS, etc.)
- Pro: Less boilerplate; familiar pattern
- Con: Hidden dependencies; complicates testing; overkill for current scope

### Why Monorepo?

**Chosen**: Monorepo with npm workspaces
- Pro: Shared types; easy refactoring; single test run; consistent versions
- Con: Larger repo; must manage workspace dependencies

**Alternative**: Polyrepo
- Pro: Independent deployments; clear boundaries
- Con: Shared types create coupling; version hell; harder to refactor

## Extension Points

### Adding a New Tool

1. Define input/output types
2. Extend BaseTool<Input, Output>
3. Implement onExecute(input, context)
4. Add to packages/tools/{name}
5. Export from packages/tools/index.ts
6. Register in registry (optional)

### Adding a New Agent

1. Define input/output types
2. Extend BaseAgent<Input, Output>
3. Implement onExecute(input, context)
4. Use tools via dependency parameter or instantiation
5. Add to packages/agents/{name}
6. Export from packages/agents/index.ts

### Adding a New Workflow

1. Define input/output types
2. Extend BaseWorkflow<Input, Output>
3. Implement onExecute(input, context)
4. Coordinate agents
5. Add to packages/workflows/src
6. Export from packages/workflows/index.ts

## Deployment Considerations

### Current State (Level 1.1)

- Single TypeScript codebase
- npm run build → tsc compilation
- npm start runs Express server
- npm run dev:web runs Vite dev server
- No database; no persistence

### Future Deployment (Level 2+)

- Separate API server
- Separate worker process for agents
- Redis for job queue
- PostgreSQL for persistence
- Docker containerization
- Kubernetes orchestration

## Performance Characteristics

### Current (Level 1.1)

- EnvironmentDiscovery: ~2-5s per URL (depends on page load time)
- API latency: < 100ms (overhead)
- Memory: ~300MB (browser process)
- Concurrent: Single execution per API instance

### Bottlenecks

- Browser page load (cannot optimize much)
- Screenshot encoding (small impact)
- HTML capture (large for complex pages)

### Optimization Strategies (Future)

- Browser pool with concurrent executions
- Screenshot compression
- Partial HTML capture (above-the-fold only)
- Result caching
- CDN for static assets

## Monitoring and Observability

### Current

- Structured JSON logging
- Event emission at lifecycle points
- Execution duration tracking
- Error code classification

### Future

- Metrics emission (Prometheus format)
- Distributed tracing (OpenTelemetry)
- APM integration
- Health checks
- Dashboard

## Security Considerations

### Current Level 1

- No authentication
- No input sanitization (URLs only)
- No output filtering
- Browser runs locally only
- No external network restrictions

### Future (Level 2+)

- JWT/OAuth for API
- URL whitelist for navigation
- Screenshot/HTML filtering
- Network isolation (containers)
- Rate limiting and DDoS protection
- Secret management

## Glossary

- **Tool**: Atomic reusable operation (BrowserTool)
- **Agent**: Coordinates tools for a specific goal (EnvironmentDiscoveryAgent)
- **Workflow**: Orchestrates agents for business processes (EnvironmentDiscoveryWorkflow)
- **Orchestrator**: Execution engine that runs workflows (Orchestrator)
- **ExecutionContext**: Runtime environment for agents/tools (carries logger, config, cancellation)
- **Result**: Outcome of execution (success/failure/timeout/cancelled + data/error + metadata)
- **Event**: Observable occurrence during execution (starts, completes, fails)
