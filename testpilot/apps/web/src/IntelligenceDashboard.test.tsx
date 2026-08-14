import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntelligenceDashboard from './IntelligenceDashboard';

const evidence = [{ id: 'EV-001', source: 'page', text: 'The application title is Test App' }];
const payload = {
  schemaVersion: '1.0', generatedAt: '2026-08-17T00:00:00.000Z', sourceExecutionId: 'execution-2', confidence: 0.82, truncated: false,
  application: {
    id: 'APP-001',
    name: { value: 'Test App', type: 'observed', evidenceIds: ['EV-001'] },
    type: { value: 'web', type: 'inferred', evidenceIds: ['EV-001'], confidence: 0.82 },
    purpose: { value: 'Search and checkout', type: 'inferred', evidenceIds: ['EV-001'], confidence: 0.7 },
  },
  characteristics: {},
  pages: [{ id: 'PAGE-001', url: 'https://example.com/search', title: 'Search', type: 'observed', featureIds: ['FEATURE-001'], evidenceIds: ['EV-001'] }],
  features: [{ id: 'FEATURE-001', name: 'Search', description: 'Search products', type: 'inferred', relatedPageIds: ['PAGE-001'], evidenceIds: ['EV-001'], confidence: 0.8 }],
  roles: [{ id: 'ROLE-001', role: 'Customer', type: 'inferred', evidenceIds: ['EV-001'], confidence: 0.7 }],
  workflows: [{ id: 'FLOW-001', name: 'Checkout', type: 'inferred', involvedPageIds: ['PAGE-001'], involvedElements: [], evidenceIds: ['EV-001'], confidence: 0.6 }],
  risks: [{ id: 'RISK-001', area: 'Input validation', reason: 'Needs validation', type: 'inferred', evidenceIds: ['EV-001'], confidence: 0.4 }],
  evidence,
};
const snapshot = { id: 'snapshot-2', applicationId: 'project-1', schemaVersion: '1.0', snapshotVersion: 2, sourceExecutionId: 'execution-2', generatedAt: payload.generatedAt, createdAt: payload.generatedAt, confidence: 0.82, payload, metadata: { pageCount: 1, featureCount: 1, roleCount: 1, workflowCount: 1, riskCount: 1, evidenceCount: 1, snapshotBytes: 1000, truncated: false } };
const previous = { ...snapshot, id: 'snapshot-1', snapshotVersion: 1, sourceExecutionId: 'execution-1' };

beforeEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/profile')) return Promise.resolve(new Response(JSON.stringify({ success: true, data: { id: 'project-1', name: 'Test App', targetUrls: ['https://example.com'], status: 'active', currentSnapshotId: 'snapshot-2', createdAt: payload.generatedAt, updatedAt: payload.generatedAt } })));
    if (url.endsWith('/intelligence/snapshots')) return Promise.resolve(new Response(JSON.stringify({ success: true, data: [snapshot, previous] })));
    if (url.endsWith('/intelligence')) return Promise.resolve(new Response(JSON.stringify({ success: true, data: snapshot })));
    if (url.includes('/compare')) return Promise.resolve(new Response(JSON.stringify({ success: true, data: { fromSnapshotId: 'snapshot-1', toSnapshotId: 'snapshot-2', addedPages: [], removedPages: [], addedFeatures: ['Search'], removedFeatures: [], addedRoles: [], removedRoles: [], addedWorkflows: [], removedWorkflows: [], addedRisks: [], removedRisks: [], changedApplication: false } })));
    return Promise.resolve(new Response(JSON.stringify({ success: true, data: snapshot })));
  }));
});

describe('IntelligenceDashboard', () => {
  it('renders real profile values, confidence, counts, and fact classifications', async () => {
    render(<IntelligenceDashboard projectId="project-1" refreshToken={0} />);
    expect((await screen.findAllByText('Test App')).length).toBeGreaterThan(0);
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getAllByText('inferred').length).toBeGreaterThan(0);
    expect(screen.getAllByText('observed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Search and checkout').length).toBeGreaterThan(0);
  });

  it('supports section navigation, search, and evidence inspection', async () => {
    render(<IntelligenceDashboard projectId="project-1" refreshToken={0} />);
    await screen.findAllByText('Test App');
    fireEvent.click(screen.getByRole('button', { name: /Features/ }));
    expect(screen.getByText('Search')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search intelligence' }), { target: { value: 'does-not-exist' } });
    expect(screen.getByText('No features yet')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search intelligence' }), { target: { value: 'search' } });
    fireEvent.click(screen.getByRole('button', { name: 'EV-001' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('The application title is Test App');
  });

  it('renders history and deterministic comparison results', async () => {
    render(<IntelligenceDashboard projectId="project-1" refreshToken={0} />);
    await screen.findAllByText('Test App');
    fireEvent.click(screen.getByRole('button', { name: /History/ }));
    expect(screen.getAllByText('CURRENT').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
    await waitFor(() => expect(screen.getByText('+ Search')).toBeInTheDocument());
  });
});
