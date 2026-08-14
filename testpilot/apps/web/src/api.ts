import type { ApplicationProfile, IntelligenceSnapshot, SnapshotComparison } from './intelligence-types';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error?.message || `Request failed with status ${response.status}`);
  }
  return body.data;
}

export function getProfile(projectId: string): Promise<ApplicationProfile> {
  return get<ApplicationProfile>(`/api/v1/projects/${encodeURIComponent(projectId)}/profile`);
}

export function getCurrentSnapshot(projectId: string): Promise<IntelligenceSnapshot> {
  return get<IntelligenceSnapshot>(`/api/v1/projects/${encodeURIComponent(projectId)}/intelligence`);
}

export function getSnapshotHistory(projectId: string): Promise<IntelligenceSnapshot[]> {
  return get<IntelligenceSnapshot[]>(`/api/v1/projects/${encodeURIComponent(projectId)}/intelligence/snapshots`);
}

export function getSnapshot(projectId: string, snapshotId: string): Promise<IntelligenceSnapshot> {
  return get<IntelligenceSnapshot>(`/api/v1/projects/${encodeURIComponent(projectId)}/intelligence/snapshots/${encodeURIComponent(snapshotId)}`);
}

export function compareSnapshots(projectId: string, from: string, to: string): Promise<SnapshotComparison> {
  return get<SnapshotComparison>(`/api/v1/projects/${encodeURIComponent(projectId)}/intelligence/compare?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}
