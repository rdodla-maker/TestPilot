import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  BrowserError,
  AgentError,
  ErrorCode,
  createExecutionId,
  createProjectId,
  ExecutionStatus,
} from '../src';

describe('Error Classes', () => {
  it('should create a validation error', () => {
    const error = new ValidationError('Test validation error');
    expect(error.code).toBe(ErrorCode.InvalidInput);
    expect(error.message).toBe('Test validation error');
    expect(error.name).toBe('ValidationError');
  });

  it('should create a browser error', () => {
    const error = new BrowserError(ErrorCode.BrowserLaunchFailed, 'Browser launch failed');
    expect(error.code).toBe(ErrorCode.BrowserLaunchFailed);
    expect(error.message).toBe('Browser launch failed');
    expect(error.name).toBe('BrowserError');
  });

  it('should create an agent error', () => {
    const error = new AgentError(ErrorCode.AgentExecutionFailed, 'Agent failed');
    expect(error.code).toBe(ErrorCode.AgentExecutionFailed);
    expect(error.message).toBe('Agent failed');
  });

  it('should serialize error to JSON', () => {
    const error = new ValidationError('Test error', { field: 'url' });
    const json = error.toJSON();
    expect(json.code).toBe(ErrorCode.InvalidInput);
    expect(json.message).toBe('Test error');
    expect(json.details).toEqual({ field: 'url' });
  });
});

describe('Type Builders', () => {
  it('should create execution ID', () => {
    const execId = createExecutionId('test-123');
    expect(execId).toBe('test-123');
  });

  it('should create project ID', () => {
    const projId = createProjectId('proj-456');
    expect(projId).toBe('proj-456');
  });
});

describe('Execution Status Enum', () => {
  it('should have correct status values', () => {
    expect(ExecutionStatus.Pending).toBe('pending');
    expect(ExecutionStatus.Running).toBe('running');
    expect(ExecutionStatus.Success).toBe('success');
    expect(ExecutionStatus.Failed).toBe('failed');
    expect(ExecutionStatus.Cancelled).toBe('cancelled');
    expect(ExecutionStatus.Timeout).toBe('timeout');
  });
});
