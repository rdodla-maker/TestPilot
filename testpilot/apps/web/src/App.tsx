import { useState } from 'react';
import IntelligenceDashboard from './IntelligenceDashboard';
import './App.css';

export default function App() {
  const [projectId, setProjectId] = useState('live-api-e2e');
  const [url, setUrl] = useState('https://example.com');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  async function discover(event: React.FormEvent) {
    event.preventDefault();
    setRunning(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/projects/${encodeURIComponent(projectId)}/environment-discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const body = (await response.json()) as { success: boolean; error?: { message: string } };
      if (!response.ok || !body.success) throw new Error(body.error?.message || 'Discovery could not be completed');
      setRefreshToken((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Discovery could not be completed');
    } finally {
      setRunning(false);
    }
  }

  return <div className="app-frame">
    <header className="command-bar">
      <div className="brand-lockup"><span className="brand-mark">TP</span><div><strong>TestPilot</strong><span>Autonomous QA intelligence</span></div></div>
      <form className="discovery-form" onSubmit={discover}>
        <label><span>Project</span><input value={projectId} onChange={(event) => setProjectId(event.target.value)} required /></label>
        <label className="url-input"><span>Target URL</span><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} required /></label>
        <button className="primary-button" type="submit" disabled={running}>{running ? 'Analyzing…' : 'Run discovery'}</button>
      </form>
    </header>
    {error && <div className="global-error" role="alert"><strong>Discovery failed</strong><span>{error}</span></div>}
    <IntelligenceDashboard projectId={projectId} refreshToken={refreshToken} />
  </div>;
}
