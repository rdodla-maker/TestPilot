/**
 * Common type definitions used across TestPilot contracts
 */
export function createExecutionId(id) {
    return id;
}
export function createProjectId(id) {
    return id;
}
export function createWorkflowId(id) {
    return id;
}
export function createAgentId(id) {
    return id;
}
export function createToolId(id) {
    return id;
}
/**
 * Execution status enum
 */
export var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["Pending"] = "pending";
    ExecutionStatus["Running"] = "running";
    ExecutionStatus["Success"] = "success";
    ExecutionStatus["Failed"] = "failed";
    ExecutionStatus["Cancelled"] = "cancelled";
    ExecutionStatus["Timeout"] = "timeout";
})(ExecutionStatus || (ExecutionStatus = {}));
/**
 * Result status enum
 */
export var ResultStatus;
(function (ResultStatus) {
    ResultStatus["Success"] = "success";
    ResultStatus["Failed"] = "failed";
    ResultStatus["Cancelled"] = "cancelled";
})(ResultStatus || (ResultStatus = {}));
//# sourceMappingURL=types.js.map