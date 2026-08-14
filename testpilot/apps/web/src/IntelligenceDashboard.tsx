import { useEffect, useMemo, useState } from 'react';
import { compareSnapshots, getCurrentSnapshot, getProfile, getSnapshot, getSnapshotHistory } from './api';
import type { ApplicationProfile, FactType, IntelligenceEvidence, IntelligenceFeature, IntelligencePage, IntelligenceRisk, IntelligenceRole, IntelligenceSnapshot, IntelligenceWorkflow, SnapshotComparison } from './intelligence-types';

type Section = 'overview' | 'pages' | 'features' | 'roles' | 'workflows' | 'risks' | 'evidence' | 'history';
type SortMode = 'name' | 'confidence';

interface Props {
  projectId: string;
  refreshToken: number;
}

const sections: Array<{ id: Section; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'pages', label: 'Pages' },
  { id: 'features', label: 'Features' },
  { id: 'roles', label: 'Roles' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'risks', label: 'Risk areas' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'history', label: 'History' },
];

function confidenceLabel(value?: number): string {
  if (value === undefined) return 'Not determined';
  if (value >= 0.9) return 'Very high';
  if (value >= 0.7) return 'High';
  if (value >= 0.4) return 'Medium';
  return 'Low';
}

function Confidence({ value }: { value?: number }) {
  if (value === undefined) return <span className="confidence unknown">Not determined</span>;
  return <span className="confidence"><span className="confidence-track"><span style={{ width: `${Math.round(value * 100)}%` }} /></span>{value.toFixed(2)} · {confidenceLabel(value)}</span>;
}

function FactBadge({ type }: { type: FactType }) {
  return <span className={`fact-badge ${type}`} aria-label={type === 'observed' ? 'Observed fact' : 'Inferred conclusion'}>{type}</span>;
}

function EvidenceList({ ids, evidence }: { ids: string[]; evidence: IntelligenceEvidence[] }) {
  const matches = ids.map((id) => evidence.find((item) => item.id === id)).filter((item): item is IntelligenceEvidence => item !== undefined);
  if (matches.length === 0) return <p className="muted">No linked evidence</p>;
  return <div className="evidence-list">{matches.map((item) => <div className="evidence-row" key={item.id}><strong>{item.id}</strong><span>{item.source || 'source not specified'}</span><p>{item.text}</p></div>)}</div>;
}

function Metric({ value, label }: { value: number | string; label: string }) {
  return <div className="metric"><strong>{value}</strong><span>{label}</span></div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="empty-state"><strong>No {label.toLowerCase()} yet</strong><span>TestPilot has not observed or inferred any {label.toLowerCase()} for this snapshot.</span></div>;
}

function ItemCard({ children, type = 'inferred' }: { children: React.ReactNode; type?: FactType }) {
  return <article className="item-card"><div className="item-card-accent" data-type={type} />{children}</article>;
}

export default function IntelligenceDashboard({ projectId, refreshToken }: Props) {
  const [profile, setProfile] = useState<ApplicationProfile | null>(null);
  const [snapshot, setSnapshot] = useState<IntelligenceSnapshot | null>(null);
  const [history, setHistory] = useState<IntelligenceSnapshot[]>([]);
  const [comparison, setComparison] = useState<SnapshotComparison | null>(null);
  const [section, setSection] = useState<Section>('overview');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('name');
  const [selectedEvidence, setSelectedEvidence] = useState<IntelligenceEvidence | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('');
  const [comparisonFrom, setComparisonFrom] = useState('');
  const [comparisonTo, setComparisonTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([getProfile(projectId), getCurrentSnapshot(projectId), getSnapshotHistory(projectId)])
      .then(([nextProfile, nextSnapshot, nextHistory]) => {
        if (!active) return;
        setProfile(nextProfile);
        setSnapshot(nextSnapshot);
        setHistory(nextHistory);
        setSelectedSnapshotId(nextSnapshot.id);
        setComparisonFrom(nextHistory.at(1)?.id || nextSnapshot.id);
        setComparisonTo(nextSnapshot.id);
      })
      .catch((cause: Error) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId, refreshToken]);

  const payload = snapshot?.payload;
  const filteredPages = useMemo(() => {
    if (!payload) return [];
    return [...payload.pages].filter((item) => `${item.title || ''} ${item.url}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sortItems(a.title || a.url, b.title || b.url, sort));
  }, [payload, search, sort]);
  const filteredFeatures = useMemo(() => filterItems(payload?.features || [], search, sort, (item) => item.name), [payload, search, sort]);
  const filteredRoles = useMemo(() => filterItems(payload?.roles || [], search, sort, (item) => item.role), [payload, search, sort]);
  const filteredWorkflows = useMemo(() => filterItems(payload?.workflows || [], search, sort, (item) => item.name), [payload, search, sort]);
  const filteredRisks = useMemo(() => filterItems(payload?.risks || [], search, sort, (item) => item.area), [payload, search, sort]);

  if (loading) return <div className="dashboard-loading" role="status"><span className="loading-orbit" />Loading application intelligence…</div>;
  if (error) return <div className="dashboard-error" role="alert"><strong>Could not load intelligence</strong><span>{error}</span><button type="button" onClick={() => window.location.reload()}>Retry</button></div>;
  if (!profile || !snapshot || !payload) return <div className="dashboard-error"><strong>No intelligence profile found</strong><span>Run a discovery for this project to create its first intelligence snapshot.</span></div>;

  const evidence = payload.evidence;
  const counts = { pages: payload.pages.length, features: payload.features.length, roles: payload.roles.length, workflows: payload.workflows.length, risks: payload.risks.length, evidence: evidence.length };

  async function loadHistoricalSnapshot(id: string) {
    setSelectedSnapshotId(id);
    if (id === snapshot.id) return;
    try { setSnapshot(await getSnapshot(projectId, id)); } catch (cause) { setError((cause as Error).message); }
  }

  async function loadComparison() {
    try { setComparison(await compareSnapshots(projectId, comparisonFrom, comparisonTo)); } catch (cause) { setError((cause as Error).message); }
  }

  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <div className="brand-lockup"><span className="brand-mark">TP</span><div><strong>TestPilot</strong><span>Application intelligence</span></div></div>
      <nav aria-label="Intelligence sections">{sections.map((item) => <button className={section === item.id ? 'nav-item active' : 'nav-item'} type="button" key={item.id} onClick={() => setSection(item.id)}><span className="nav-index">{String(sections.indexOf(item) + 1).padStart(2, '0')}</span>{item.label}</button>)}</nav>
      <div className="sidebar-footer"><span className="live-dot" />Profile synced</div>
    </aside>
    <main className="dashboard-main">
      <header className="dashboard-header"><div><p className="eyebrow">Intelligence workspace · snapshot v{snapshot.snapshotVersion}</p><h1>{payload.application.name.value || 'Application profile'}</h1><p className="header-subtitle">A living, evidence-backed view of what TestPilot currently knows.</p></div><div className="header-meta"><span className="status-pill">CURRENT</span><span>Updated {formatDate(snapshot.createdAt)}</span></div></header>
      <section className="workspace-toolbar"><label className="search-field"><span>⌕</span><input aria-label="Search intelligence" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pages, features, roles…" /></label><label className="sort-field">Sort<select aria-label="Sort intelligence" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="name">Name</option><option value="confidence">Confidence</option></select></label></section>

      {section === 'overview' && <Overview payload={payload} profile={profile} snapshot={snapshot} counts={counts} onEvidence={setSelectedEvidence} />}
      {section === 'pages' && <CollectionSection title="Pages explorer" description="Observed surfaces from the latest application scan."><div className="collection-grid">{filteredPages.length ? filteredPages.map((item) => <PageCard item={item} evidence={evidence} onEvidence={setSelectedEvidence} key={item.id} />) : <EmptyState label="Pages" />}</div></CollectionSection>}
      {section === 'features' && <CollectionSection title="Features" description="Capabilities inferred from observed application evidence."><div className="collection-grid">{filteredFeatures.length ? filteredFeatures.map((item) => <FeatureCard item={item} evidence={evidence} onEvidence={setSelectedEvidence} key={item.id} />) : <EmptyState label="Features" />}</div></CollectionSection>}
      {section === 'roles' && <CollectionSection title="User roles" description="Inferred audiences TestPilot found in the application surface."><div className="collection-grid">{filteredRoles.length ? filteredRoles.map((item) => <RoleCard item={item} evidence={evidence} onEvidence={setSelectedEvidence} key={item.id} />) : <EmptyState label="Roles" />}</div></CollectionSection>}
      {section === 'workflows' && <CollectionSection title="Workflows" description="Intelligence summaries only. These workflows are not executable."><div className="collection-grid">{filteredWorkflows.length ? filteredWorkflows.map((item) => <WorkflowCard item={item} evidence={evidence} onEvidence={setSelectedEvidence} key={item.id} />) : <EmptyState label="Workflows" />}</div></CollectionSection>}
      {section === 'risks' && <CollectionSection title="Potential QA risks" description="Signals worth validating later, not confirmed bugs or vulnerabilities."><div className="collection-grid">{filteredRisks.length ? filteredRisks.map((item) => <RiskCard item={item} evidence={evidence} onEvidence={setSelectedEvidence} key={item.id} />) : <EmptyState label="Risk areas" />}</div></CollectionSection>}
      {section === 'evidence' && <EvidenceSection evidence={evidence} selected={selectedEvidence} onSelect={setSelectedEvidence} />}
      {section === 'history' && <HistorySection history={history} selectedId={selectedSnapshotId} comparison={comparison} comparisonFrom={comparisonFrom} comparisonTo={comparisonTo} onSelect={loadHistoricalSnapshot} onFrom={setComparisonFrom} onTo={setComparisonTo} onCompare={loadComparison} />}
    </main>
    {selectedEvidence && <div className="drawer-backdrop" onClick={() => setSelectedEvidence(null)}><aside className="evidence-drawer" role="dialog" aria-modal="true" aria-label="Evidence inspector" onClick={(event) => event.stopPropagation()}><button className="close-button" type="button" onClick={() => setSelectedEvidence(null)} aria-label="Close evidence inspector">×</button><p className="eyebrow">Evidence inspector</p><h2>{selectedEvidence.id}</h2><span className="source-label">{selectedEvidence.source || 'Source not specified'}</span><p className="drawer-evidence">{selectedEvidence.text}</p></aside></div>}
  </div>;
}

function sortItems(a: string, b: string, mode: SortMode, confidenceA?: number, confidenceB?: number): number { return mode === 'confidence' ? (confidenceB || 0) - (confidenceA || 0) : a.localeCompare(b); }
function filterItems<T extends { confidence?: number }>(items: T[], search: string, sort: SortMode, label: (item: T) => string): T[] { return [...items].filter((item) => label(item).toLowerCase().includes(search.toLowerCase())).sort((a, b) => sortItems(label(a), label(b), sort, a.confidence, b.confidence)); }
function formatDate(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function CollectionSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">Explorer</p><h2>{title}</h2><p>{description}</p></div></div>{children}</section>; }
function Overview({ payload, profile, snapshot, counts, onEvidence }: { payload: IntelligenceSnapshot['payload']; profile: ApplicationProfile; snapshot: IntelligenceSnapshot; counts: Record<string, number>; onEvidence: (item: IntelligenceEvidence) => void }) { return <section className="dashboard-section overview-section"><div className="hero-grid"><div className="hero-copy"><p className="eyebrow">Current intelligence</p><h2>{payload.application.purpose?.value || 'Purpose not determined'}</h2><p>{profile.targetUrls[0] || 'Target URL not determined'}</p><div className="fact-line"><FactBadge type="observed" /><span>{payload.application.name.value || 'Application name not determined'}</span></div><div className="fact-line"><FactBadge type="inferred" /><span>{payload.application.type?.value || 'Application type not determined'}</span></div></div><div className="confidence-panel"><span>Overall confidence</span><strong>{Math.round(snapshot.confidence * 100)}%</strong><Confidence value={snapshot.confidence} /></div></div><div className="metric-grid">{Object.entries(counts).map(([label, value]) => <Metric key={label} value={value} label={label} />)}<Metric value={`v${snapshot.snapshotVersion}`} label="snapshot" /></div><div className="profile-band"><div><span className="eyebrow">Application profile</span><h3>{profile.name || 'Name not determined'}</h3><p>{payload.application.businessDomain?.value || 'Business domain not determined'} · schema {snapshot.schemaVersion}</p></div><div className="profile-facts"><span>Last analyzed <strong>{formatDate(snapshot.createdAt)}</strong></span><span>Execution <strong>{snapshot.sourceExecutionId}</strong></span></div></div><div className="overview-columns"><div><h3>What is observed</h3><p className="muted">Directly captured from the application surface.</p><div className="fact-line"><FactBadge type="observed" /><span>{payload.pages.length} page surface{payload.pages.length === 1 ? '' : 's'}</span></div><div className="fact-line"><FactBadge type="observed" /><span>{payload.evidence.length} evidence items</span></div></div><div><h3>What is inferred</h3><p className="muted">Structured conclusions grounded in linked evidence.</p>{[payload.application.type, payload.application.purpose, payload.application.businessDomain].filter((item): item is NonNullable<typeof item> => item !== undefined).map((item) => <button className="inference-link" type="button" key={item.value || 'empty'} onClick={() => item.evidenceIds[0] && onEvidence(payload.evidence.find((evidence) => evidence.id === item.evidenceIds[0]) || payload.evidence[0])}>{item.value} <Confidence value={item.confidence} /></button>)}</div></div></section>; }
function PageCard({ item, evidence, onEvidence }: { item: IntelligencePage; evidence: IntelligenceEvidence[]; onEvidence: (item: IntelligenceEvidence) => void }) { return <ItemCard type="observed"><div className="card-top"><span className="entity-id">{item.id}</span><FactBadge type="observed" /></div><h3>{item.title || 'Untitled page'}</h3><a className="safe-url" href={item.url} target="_blank" rel="noreferrer">{item.url}</a>{item.purpose && <p className="inferred-text"><FactBadge type="inferred" />{item.purpose.value}</p>}<EvidenceList ids={item.evidenceIds} evidence={evidence} /><EvidenceButtons ids={item.evidenceIds} evidence={evidence} onEvidence={onEvidence} /></ItemCard>; }
function FeatureCard({ item, evidence, onEvidence }: { item: IntelligenceFeature; evidence: IntelligenceEvidence[]; onEvidence: (item: IntelligenceEvidence) => void }) { return <ItemCard><div className="card-top"><span className="entity-id">{item.id}</span><FactBadge type={item.type} /></div><h3>{item.name}</h3><Confidence value={item.confidence} />{item.description && <p>{item.description}</p>}<p className="muted">Related pages: {item.relatedPageIds.join(', ') || 'None'}</p><EvidenceList ids={item.evidenceIds} evidence={evidence} /><EvidenceButtons ids={item.evidenceIds} evidence={evidence} onEvidence={onEvidence} /></ItemCard>; }
function RoleCard({ item, evidence, onEvidence }: { item: IntelligenceRole; evidence: IntelligenceEvidence[]; onEvidence: (item: IntelligenceEvidence) => void }) { return <ItemCard><div className="card-top"><span className="entity-id">{item.id}</span><FactBadge type={item.type} /></div><h3>{item.role}</h3><Confidence value={item.confidence} /><EvidenceButtons ids={item.evidenceIds} evidence={evidence} onEvidence={onEvidence} /></ItemCard>; }
function WorkflowCard({ item, evidence, onEvidence }: { item: IntelligenceWorkflow; evidence: IntelligenceEvidence[]; onEvidence: (item: IntelligenceEvidence) => void }) { return <ItemCard><div className="card-top"><span className="entity-id">{item.id}</span><FactBadge type={item.type} /></div><h3>{item.name}</h3><Confidence value={item.confidence} />{item.description && <p>{item.description}</p>}<p className="muted">Pages: {item.involvedPageIds.join(', ') || 'None'} · Elements: {item.involvedElements.join(', ') || 'None'}</p><EvidenceButtons ids={item.evidenceIds} evidence={evidence} onEvidence={onEvidence} /></ItemCard>; }
function RiskCard({ item, evidence, onEvidence }: { item: IntelligenceRisk; evidence: IntelligenceEvidence[]; onEvidence: (item: IntelligenceEvidence) => void }) { return <ItemCard><div className="card-top"><span className="entity-id">{item.id}</span><FactBadge type={item.type} /></div><h3>Potential QA risk · {item.area}</h3><Confidence value={item.confidence} />{item.reason && <p>{item.reason}</p>}<EvidenceButtons ids={item.evidenceIds} evidence={evidence} onEvidence={onEvidence} /></ItemCard>; }
function EvidenceButtons({ ids, evidence, onEvidence }: { ids: string[]; evidence: IntelligenceEvidence[]; onEvidence: (item: IntelligenceEvidence) => void }) { return <div className="evidence-buttons">{ids.map((id) => { const item = evidence.find((candidate) => candidate.id === id); return item ? <button type="button" key={id} onClick={() => onEvidence(item)}>{id}</button> : <span className="missing-evidence" key={id}>{id} unavailable</span>; })}</div>; }
function EvidenceSection({ evidence, selected, onSelect }: { evidence: IntelligenceEvidence[]; selected: IntelligenceEvidence | null; onSelect: (item: IntelligenceEvidence) => void }) { return <CollectionSection title="Evidence inspector" description="Structured observations behind TestPilot's conclusions."><div className="evidence-table">{evidence.length ? evidence.map((item) => <button type="button" className={selected?.id === item.id ? 'evidence-table-row selected' : 'evidence-table-row'} key={item.id} onClick={() => onSelect(item)}><strong>{item.id}</strong><span>{item.source || 'Source not specified'}</span><p>{item.text}</p></button>) : <EmptyState label="Evidence" />}</div></CollectionSection>; }
function HistorySection({ history, selectedId, comparison, comparisonFrom, comparisonTo, onSelect, onFrom, onTo, onCompare }: { history: IntelligenceSnapshot[]; selectedId: string; comparison: SnapshotComparison | null; comparisonFrom: string; comparisonTo: string; onSelect: (id: string) => void; onFrom: (id: string) => void; onTo: (id: string) => void; onCompare: () => void }) { return <CollectionSection title="Snapshot history" description="Every persisted intelligence revision remains available for review."><div className="history-list">{history.length ? history.map((item) => <button type="button" className={item.id === selectedId ? 'history-row current' : 'history-row'} key={item.id} onClick={() => onSelect(item.id)}><span className="history-version">v{item.snapshotVersion}</span><span><strong>{item.id}</strong><small>{formatDate(item.createdAt)} · {item.sourceExecutionId}</small></span><Confidence value={item.confidence} /><span className="history-state">{item.id === history[0]?.id ? 'CURRENT' : 'HISTORICAL'}</span></button>) : <EmptyState label="History" />}</div>{history.length > 1 && <div className="comparison-panel"><div className="section-heading"><div><p className="eyebrow">Deterministic diff</p><h3>Compare snapshots</h3><p>Structural changes only. No additional AI reasoning is used.</p></div></div><div className="comparison-controls"><label>From<select value={comparisonFrom} onChange={(event) => onFrom(event.target.value)}>{history.map((item) => <option value={item.id} key={item.id}>v{item.snapshotVersion}</option>)}</select></label><span>→</span><label>To<select value={comparisonTo} onChange={(event) => onTo(event.target.value)}>{history.map((item) => <option value={item.id} key={item.id}>v{item.snapshotVersion}</option>)}</select></label><button className="secondary-button" type="button" onClick={onCompare}>Compare</button></div>{comparison && <ComparisonResult comparison={comparison} />}</div>}</CollectionSection>; }
function ComparisonResult({ comparison }: { comparison: SnapshotComparison }) { const groups: Array<[string, string[], string[]]> = [['Pages', comparison.addedPages, comparison.removedPages], ['Features', comparison.addedFeatures, comparison.removedFeatures], ['Roles', comparison.addedRoles, comparison.removedRoles], ['Workflows', comparison.addedWorkflows, comparison.removedWorkflows], ['Risks', comparison.addedRisks, comparison.removedRisks]]; return <div className="comparison-result"><div className="change-summary"><strong>Snapshot comparison</strong><span>{groups.reduce((total, [, added, removed]) => total + added.length + removed.length, 0)} structural changes</span></div>{groups.map(([label, added, removed]) => <div className="change-group" key={label}><strong>{label}</strong>{added.map((item) => <span className="change added" key={`add-${item}`}>+ {item}</span>)}{removed.map((item) => <span className="change removed" key={`remove-${item}`}>− {item}</span>)}{added.length === 0 && removed.length === 0 && <span className="change none">No changes</span>}</div>)}{comparison.changedApplication && <span className="change changed">Application identity changed</span>}</div>; }
