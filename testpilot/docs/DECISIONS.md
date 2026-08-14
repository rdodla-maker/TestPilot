# Implementation Decisions

This document records key design decisions made during TestPilot Level 1.1 implementation, including rationale and trade-offs.

## Decision 1: Contracts-First Design

**Decision**: Define all interfaces in `packages/contracts` before any implementation.

**Rationale**:
- Enables parallel development across layers
- Provides clear contracts for testing
- Prevents implementation details from driving architecture
- Single source of truth for all types

**Alternatives Considered**:
1. Inline type definitions in each package
   - Simpler initially but causes duplication
   - Harder to maintain consistency
2. Generate types from runtime code
   - Requires schema validation framework
   - Makes testing harder (need actual implementations)

**Consequences**:
- ✅ Clear separation of interface vs. implementation
- ✅ Easy to mock for testing
- ✅ Minimal package dependency graph
- ⚠️ Requires discipline to not add logic to contracts

**When to Revisit**: If contracts package grows beyond 200 lines or needs complex validation logic.

---

## Decision 2: Result Objects Instead of Exceptions

**Decision**: Agents and workflows return `AgentResult<T>` / `WorkflowResult<T>` instead of throwing exceptions.

**Rationale**:
- Preserves observability (no unwinding stack)
- Makes error handling explicit
- Enables distributed tracing systems to log all states
- Easier to test (no exception mocking needed)

**Implementation**:
```typescript
type AgentResult<T> = 
  | { status: 'success'; data: T; metadata: ExecutionMetadata }
  | { status: 'failure'; error: ApplicationError; metadata: ExecutionMetadata }
  | { status: 'cancelled'; error: CancelledError; metadata: ExecutionMetadata }
  | { status: 'timeout'; error: TimeoutError; metadata: ExecutionMetadata }
```

**Alternatives Considered**:
1. Exceptions with middleware catch-all
   - Familiar pattern
   - Loses intermediate state
   - Harder to trace distributed execution
2. Error callbacks (onError parameter)
   - Too verbose for single-use agents
   - Creates coupling

**Consequences**:
- ✅ Explicit error handling
- ✅ Complete execution metadata always available
- ✅ No exception propagation confusion
- ⚠️ More verbose than try/catch
- ⚠️ Requires discipline to check .status before accessing .data

**When to Revisit**: If error handling becomes too verbose or if 80%+ of code ignores error results.

---

## Decision 3: ExecutionContext Parameter Instead of DI Framework

**Decision**: Pass `ExecutionContext` as explicit parameter rather than using dependency injection.

**Rationale**:
- No framework dependency
- Explicit parameter makes dependencies visible
- Testable without framework setup
- Easy to understand execution flow
- No magic or reflection

**Implementation**:
```typescript
interface ITool<Input, Output> {
  execute(input: Input, context: ExecutionContext): Promise<ToolResult<Output>>;
}

// Usage
const result = await tool.execute(input, { logger, config, cancellationToken, ... });
```

**Alternatives Considered**:
1. InversifyJS or similar DI framework
   - Eliminates parameter passing
   - Familiar to enterprise developers
   - Hides dependencies; complicates testing
2. Global context (async_local_storage)
   - Reduces parameters
   - Makes context implicit
   - Hard to test; can cause issues with parallel execution
3. Class-based agents with constructor injection
   - Traditional OOP
   - Harder to compose
   - Complicates serialization

**Consequences**:
- ✅ Explicit dependencies
- ✅ Easy to test with mock context
- ✅ No framework overhead
- ✅ Clear execution flow
- ⚠️ More verbose than DI
- ⚠️ Parameter threading through multiple layers

**When to Revisit**: If code becomes deeply nested (> 5 levels) and parameter passing becomes painful.

---

## Decision 4: Monorepo with npm Workspaces

**Decision**: Use npm workspaces for monorepo instead of separate repositories.

**Rationale**:
- Shared types prevent duplication
- Single test run covers entire system
- Easy to refactor across packages
- Consistent versions across packages
- Turbo for efficient builds

**Alternatives Considered**:
1. Polyrepo (separate npm packages)
   - Clear ownership boundaries
   - Independent deployments
   - Version hell and shared type duplication
   - Harder to refactor across services
2. Monorepo with Lerna
   - More complex setup
   - Turbo is newer and simpler

**Consequences**:
- ✅ Single source of truth for types
- ✅ Easy refactoring
- ✅ Simple shared dependency management
- ⚠️ Larger repository
- ⚠️ Must manage workspace dependencies carefully
- ⚠️ All packages version together

**When to Revisit**: When individual packages need independent release cycles or when repository size becomes unwieldy (> 50MB).

---

## Decision 5: Layered Dependency Hierarchy

**Decision**: Enforce strict dependency hierarchy: Contracts → Core → Tools/Agents → Workflows → Orchestrator → API.

**Rationale**:
- Prevents circular dependencies
- Clear separation of concerns
- Lower layers can be tested independently
- Easier to understand architecture
- Facilitates future splitting into services

**Implementation**:
```
1. contracts       (zero dependencies)
2. core, config    (depend only on contracts)
3. tools, agents   (depend on contracts + core)
4. workflows       (depend on contracts + core + agents)
5. orchestrator    (depend on contracts + core + workflows)
6. api/web apps    (depend on lower layers)
```

**Enforcement**:
- ESLint rules to check import paths
- Code review checklist
- Architecture documentation

**Alternatives Considered**:
1. No restrictions
   - Simpler locally
   - Creates circular dependencies
   - Impossible to understand system
2. Package-private access (TypeScript experimental)
   - Enforces at compile time
   - Still experimental
   - Requires tooling changes

**Consequences**:
- ✅ Clear dependency flow
- ✅ No circular dependency issues
- ✅ Testable lower layers
- ⚠️ Sometimes requires adapter patterns (e.g., API error mapping)
- ⚠️ Requires discipline to maintain

**When to Revisit**: If architectural layering adds > 20% overhead in lines of code or complexity.

---

## Decision 6: Playwright for Browser Automation

**Decision**: Use Playwright for BrowserTool instead of Puppeteer or Cypress.

**Rationale**:
- Multi-browser support (Chromium, Firefox, WebKit)
- Lower-level API for programmatic control
- Good error handling for network failures
- Active development and maintenance
- Better for non-interactive testing

**Alternatives Considered**:
1. Puppeteer
   - Good support but Chromium-only
   - Lower-level API
   - Deprecated in favor of playwright/puppeteer-core
2. Cypress
   - Great for interactive testing
   - Built-in UI (not needed)
   - Less suitable for headless batch processing

**Consequences**:
- ✅ Multi-browser support (future-proof)
- ✅ Good API for page observation
- ✅ Better error handling
- ⚠️ Slightly larger bundle
- ⚠️ Learning curve for new team members

**When to Revisit**: If performance becomes critical (measure page load time delta) or if testing requirements shift to interactive testing.

---

## Decision 7: Vitest for Testing

**Decision**: Use Vitest for unit tests instead of Jest.

**Rationale**:
- Native ESM support (monorepo uses ES modules)
- Faster test execution
- Same familiar Jest API
- TypeScript support out of the box
- Better for TypeScript projects

**Alternatives Considered**:
1. Jest
   - Most popular
   - Requires transpilation for ESM
   - Slower for large test suites
2. Mocha + Chai
   - Lightweight
   - Less integrated
   - More setup required

**Consequences**:
- ✅ Fast test execution
- ✅ Native ESM support
- ✅ Zero-config TypeScript
- ⚠️ Smaller ecosystem than Jest
- ⚠️ Less battle-tested

**When to Revisit**: If CI/CD times become a bottleneck or if team strongly prefers Jest.

---

## Decision 8: Express for API Server

**Decision**: Use Express.js for the API server instead of other frameworks.

**Rationale**:
- Minimal and lightweight
- Perfect for adapter layer
- Easy to understand
- Ecosystem of middleware
- Not over-engineered for Level 1 needs

**Alternatives Considered**:
1. Fastify
   - Faster
   - Better for high-throughput
   - Overkill for current requirements
2. NestJS
   - Full framework
   - Dependency injection
   - Adds complexity not needed yet

**Consequences**:
- ✅ Minimal overhead
- ✅ Easy to understand
- ✅ Can add features incrementally
- ⚠️ Less opinionated
- ⚠️ More middleware setup

**When to Revisit**: When API needs become more complex (e.g., Level 3 with 10+ endpoints, complex authentication, rate limiting).

---

## Decision 9: React for Web UI

**Decision**: Use React with Vite for the web UI instead of other frameworks.

**Rationale**:
- Familiar to team
- Vite provides excellent development experience
- Lightweight components suitable for Level 1 UI
- Can add complexity later if needed

**Alternatives Considered**:
1. Vue
   - Simpler learning curve
   - Also works great with Vite
2. Svelte
   - Smaller bundle
   - Less team experience
3. Plain HTML/JavaScript
   - No build step
   - Less maintainable
   - Would require UI framework soon

**Consequences**:
- ✅ Familiar component model
- ✅ Excellent DX with Vite
- ✅ Easy to add libraries later
- ⚠️ Slightly larger bundle than alternatives
- ⚠️ Requires build step

**When to Revisit**: If bundle size becomes critical or if UI requirements shift significantly.

---

## Decision 10: CORS Configuration with Hardcoded Origins

**Decision**: API includes CORS middleware with configurable origins (default: http://localhost:3001).

**Rationale**:
- Required for browser security
- Level 1 only supports single web app
- Configurable for different environments

**Alternatives Considered**:
1. No CORS (API-only, no web UI)
   - Simpler but reduces usefulness
2. Allow all origins (* )
   - Security risk
3. Dynamic origin validation
   - Overkill for current scope

**Consequences**:
- ✅ Secure by default
- ✅ Easy to configure
- ⚠️ Requires setup for other clients
- ⚠️ Mobile apps or other ports must be added to config

**When to Revisit**: When supporting multiple clients or deploying to production (add AUTH headers, remove CORS if API and UI co-located).

---

## Decision 11: No Database Layer (Level 1)

**Decision**: Level 1.1 has no persistence; results are in-memory only.

**Rationale**:
- Simplifies initial implementation
- Focuses on core business logic (discovery)
- Easy to add persistence later
- Tests don't require database setup

**Alternatives Considered**:
1. SQLite for local development
   - Would complicate setup
   - Needed for persistence anyway
2. In-memory event store
   - Adds complexity for Level 1
   - Better to defer

**Consequences**:
- ✅ Simpler implementation
- ✅ Faster tests
- ✅ No database dependencies
- ⚠️ Results lost on server restart
- ⚠️ No execution history
- ⚠️ No multi-instance support

**When to Revisit**: Level 1.2 when execution history becomes valuable or multi-instance deployment needed.

---

## Decision 12: Typed ID Types (Branded Types)

**Decision**: Use branded types for IDs (ExecutionId, ProjectId, etc.) instead of plain strings.

**Rationale**:
- Prevents accidental mixing of different IDs
- Type safety without runtime overhead
- Makes code self-documenting
- Catches bugs at compile time

**Implementation**:
```typescript
type ExecutionId = string & { readonly __executionId: unique symbol };
function createExecutionId(id: string): ExecutionId {
  return id as ExecutionId;
}
```

**Alternatives Considered**:
1. Enums
   - Overkill for dynamic IDs
   - Runtime overhead
2. Classes
   - Runtime overhead
   - Serialization complexity
3. Plain strings
   - No type safety
   - Easy to mix IDs

**Consequences**:
- ✅ Compile-time type safety
- ✅ Zero runtime overhead
- ✅ Self-documenting
- ⚠️ Requires builder functions
- ⚠️ Not familiar to all TypeScript developers

**When to Revisit**: If team expresses confusion or if ID validation becomes complex.

---

## Decision 13: Event Emitter in Base Classes

**Decision**: Agents/workflows emit events for lifecycle changes; applications can listen.

**Rationale**:
- Enables monitoring without changing agent code
- Supports distributed tracing
- Allows metrics collection
- Decouples observability from business logic

**Alternatives Considered**:
1. Callback parameters (onStart, onError, etc.)
   - More verbose
   - Hard to extend with new events
2. Logging only
   - Events are harder to process
   - No structured data

**Consequences**:
- ✅ Extensible observability
- ✅ Can add new listeners without changing agents
- ✅ Structured event data
- ⚠️ Adds complexity
- ⚠️ Events not used much in Level 1

**When to Revisit**: Level 2 when multi-agent orchestration needs inter-agent communication.

---

## Decision 14: Error Details as Optional Field

**Decision**: ApplicationError includes optional `details` field for context without making contract verbose.

**Rationale**:
- Some errors need context (URL that failed, DNS record, etc.)
- Should be optional to keep API simple
- Enables debugging without exposing internal structure

**Implementation**:
```typescript
class ApplicationError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) { ... }
}
```

**Alternatives Considered**:
1. Always include details
   - Makes every error bigger
   - Noisy API responses
2. Error codes only
   - Harder to debug
   - Loses valuable context
3. Separate error type per code
   - Too many classes
   - Hard to maintain

**Consequences**:
- ✅ Flexible error reporting
- ✅ Optional details don't clutter responses
- ✅ Easy to add debugging info
- ⚠️ Inconsistent error structure
- ⚠️ Clients must handle missing details gracefully

**When to Revisit**: If error handling becomes complex or error structure stabilizes.

---

## Decision 15: No Input Validation Framework

**Decision**: BrowserTool and agents validate input manually instead of using zod/joi.

**Rationale**:
- Level 1 has minimal validation rules
- Avoids framework dependency
- Validation logic is simple and clear
- Can add framework later if needed

**Alternatives Considered**:
1. Zod for schema validation
   - Powerful
   - Not needed for 2-3 fields
   - Adds 50KB+ to bundle
2. Joi
   - Mature
   - Similar overhead

**Consequences**:
- ✅ No new dependencies
- ✅ Clear validation logic
- ✅ Smaller bundle
- ⚠️ Manual validation as complexity grows
- ⚠️ Less structured error messages

**When to Revisit**: Level 2 if validation rules exceed 100 lines or if multiple agents need similar validation.

---

## Summary Table

| Decision | Choice | Primary Reason |
|----------|--------|-----------------|
| Architecture | Contracts-first layering | Clear separation; testable |
| Error Handling | Result objects | Observable; explicit |
| Dependencies | ExecutionContext parameter | Testable; no framework |
| Repository | Monorepo (npm workspaces) | Shared types; easy refactoring |
| Dependency Flow | Strict hierarchy | No circular deps |
| Browser | Playwright | Multi-browser; good API |
| Testing | Vitest | Fast; native ESM |
| API Framework | Express | Minimal; adaptable |
| UI Framework | React + Vite | Familiar; good DX |
| IDs | Branded types | Type safety |
| Observability | Event emitter | Extensible |
| Persistence | None (Level 1) | Simpler; can add later |
| Validation | Manual | Simple rules; no overhead |

---

## Known Issues and Deferred Decisions

### No HTTP Status Code Standardization

Currently, the API returns HTTP 200 for both success and failure, with success indicated by the JSON body. This should be revisited to return:
- HTTP 200 for success
- HTTP 400 for validation errors
- HTTP 500 for server errors

**Deferred to**: Level 1.2 when error handling is refined

### No Request Logging Middleware

API server has minimal logging. Should add structured request/response logging with correlation IDs.

**Deferred to**: Level 1.2

### No Rate Limiting

API has no rate limiting. Should add once multi-instance deployment is considered.

**Deferred to**: Level 2

### No Input Sanitization

URLs are validated but not sanitized (e.g., preventing file:// or internal-only URLs).

**Deferred to**: Level 1.2 when security requirements are defined

---

## Future Reconsideration Triggers

These decisions should be revisited if:

1. **Contracts-First Design**: If contracts package exceeds 500 lines or needs complex logic
2. **Result Objects**: If 80%+ of code ignores error results or needs exception-based control flow
3. **ExecutionContext**: If code nesting exceeds 5 levels and parameter threading becomes painful
4. **Monorepo**: If repository exceeds 50MB or packages need independent release cycles
5. **Dependency Hierarchy**: If layering adds > 20% overhead or too many adapter patterns needed
6. **Playwright**: If performance testing needs interactive control or bundle size critical
7. **Vitest**: If CI/CD times become a bottleneck or team strongly prefers Jest
8. **Express**: If API needs complex features (auth, rate limiting, tracing middleware)
9. **React**: If bundle size critical or UI requirements shift dramatically
10. **No Database**: If Level 1.2 requires execution history or multi-instance support

---

End of Implementation Decisions document.
