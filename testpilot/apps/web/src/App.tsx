import React, { useState } from 'react';
import './App.css';

interface Observation {
  requestedUrl: string;
  finalUrl: string;
  title: string;
  viewport: { width: number; height: number };
  screenshot: { path: string };
  navigationStatus?: { status: number; statusText: string };
  loadDuration: number;
  timestamp: string;
}

interface EnvironmentDiscoveryResponse {
  projectId: string;
  executionId: string;
  status: string;
  observation?: Observation;
  error?: { code: string; message: string };
  metadata: { executionTime: number; toolsUsed: string[] };
  applicationMetadata?: any;
}

export default function App() {
  const [url, setUrl] = useState('https://example.com');
  const [projectId, setProjectId] = useState('project-1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnvironmentDiscoveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/projects/${projectId}/environment-discovery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Unknown error occurred');
      } else {
        setResult(data.data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>TestPilot - Level 1</h1>
        <p>Environment Discovery</p>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Project ID</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter project ID"
              required
            />
          </div>

          <div className="form-group">
            <label>URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Discovering...' : 'Start Discovery'}
          </button>
        </form>

        {error && (
          <div className="error-box">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result-box">
            <h2>Discovery Result</h2>

            <div className="metadata">
              <p>
                <strong>Execution ID:</strong> {result.executionId}
              </p>
              <p>
                <strong>Status:</strong> {result.status}
              </p>
              <p>
                <strong>Execution Time:</strong> {result.metadata.executionTime}ms
              </p>
              <p>
                <strong>Tools Used:</strong> {result.metadata.toolsUsed.join(', ')}
              </p>
            </div>

            {result.error && (
              <div className="error-details">
                <h3>Error Details</h3>
                <p>
                  <strong>Code:</strong> {result.error.code}
                </p>
                <p>
                  <strong>Message:</strong> {result.error.message}
                </p>
              </div>
            )}

            {result.observation && (
              <div className="observation">
                <h3>Page Observation</h3>

                <div className="observation-details">
                  <p>
                    <strong>Requested URL:</strong> {result.observation.requestedUrl}
                  </p>
                  <p>
                    <strong>Final URL:</strong> {result.observation.finalUrl}
                  </p>
                  <p>
                    <strong>Title:</strong> {result.observation.title}
                  </p>
                  <p>
                    <strong>Viewport:</strong> {result.observation.viewport.width}x
                    {result.observation.viewport.height}
                  </p>
                  <p>
                    <strong>Load Duration:</strong> {result.observation.loadDuration}ms
                  </p>
                  <p>
                    <strong>Timestamp:</strong> {result.observation.timestamp}
                  </p>

                  {result.observation.navigationStatus && (
                    <p>
                      <strong>HTTP Status:</strong> {result.observation.navigationStatus.status}{' '}
                      {result.observation.navigationStatus.statusText}
                    </p>
                  )}
                </div>

                {result.observation.screenshot.path && (
                  <div className="screenshot">
                    <p>
                      <strong>Screenshot:</strong> {result.observation.screenshot.path}
                    </p>
                  </div>
                )}
              </div>
            )}

            {result.applicationMetadata && (
              <div className="application-metadata">
                <h3>Application Metadata</h3>

                <p>
                  <strong>Title:</strong> {result.applicationMetadata.title || '—'}
                </p>
                <p>
                  <strong>URL:</strong> {result.applicationMetadata.url || '—'}
                </p>

                <div className="metadata-counts">
                  <p>
                    <strong>Headings:</strong> {result.applicationMetadata.headings?.length ?? 0}
                  </p>
                  <p>
                    <strong>Links:</strong> {result.applicationMetadata.links?.length ?? 0}
                  </p>
                  <p>
                    <strong>Buttons:</strong> {result.applicationMetadata.buttons?.length ?? 0}
                  </p>
                  <p>
                    <strong>Images:</strong> {result.applicationMetadata.images?.length ?? 0}
                  </p>
                </div>

                {result.applicationMetadata.headings && (
                  <div className="headings-list">
                    <h4>Headings</h4>
                    <ul>
                      {result.applicationMetadata.headings.slice(0, 20).map((h: any, i: number) => (
                        <li key={i}>{h.text} ({h.level})</li>
                      ))}
                    </ul>
                  </div>
                )}

                <details>
                  <summary>Raw Metadata (JSON)</summary>
                  <pre style={{ maxHeight: 400, overflow: 'auto' }}>
                    {JSON.stringify(result.applicationMetadata, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
