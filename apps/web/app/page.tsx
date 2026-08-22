'use client';

import { useMemo, useState } from 'react';

type Section =
  | 'Overview'
  | 'Users'
  | 'Calls'
  | 'Searches'
  | 'Properties'
  | 'Brokers'
  | 'Notifications'
  | 'Matching'
  | 'System Health';

const sections: Section[] = [
  'Overview',
  'Users',
  'Calls',
  'Searches',
  'Properties',
  'Brokers',
  'Notifications',
  'Matching',
  'System Health',
];

const properties = [
  {
    id: 'PR-1042',
    title: '2 BHK apartment',
    location: 'HSR Layout, Bengaluru',
    rent: '₹32,000',
    score: 92,
    status: 'Active',
    broker: 'Demo Realty 3',
  },
  {
    id: 'PR-1038',
    title: '2 BHK semi-furnished home',
    location: 'Koramangala, Bengaluru',
    rent: '₹34,500',
    score: 88,
    status: 'Active',
    broker: 'Demo Realty 1',
  },
  {
    id: 'PR-1031',
    title: '1 BHK city apartment',
    location: 'Indiranagar, Bengaluru',
    rent: '₹26,000',
    score: 84,
    status: 'Active',
    broker: 'Demo Realty 4',
  },
  {
    id: 'PR-1026',
    title: '3 BHK family apartment',
    location: 'Whitefield, Bengaluru',
    rent: '₹41,000',
    score: 79,
    status: 'Paused',
    broker: 'Demo Realty 2',
  },
];

const navIcons: Record<Section, string> = {
  Overview: '⌂',
  Users: '◉',
  Calls: '◌',
  Searches: '⌕',
  Properties: '▦',
  Brokers: '◆',
  Notifications: '◫',
  Matching: '↗',
  'System Health': '♡',
};

function Status({
  children,
  tone = 'green',
}: {
  children: React.ReactNode;
  tone?: 'green' | 'amber' | 'gray';
}) {
  return (
    <span className={`status status-${tone}`}>
      <span />
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong className={accent}>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default function HomePage() {
  const [active, setActive] = useState<Section>('Overview');
  const [query, setQuery] = useState('');
  const filteredProperties = useMemo(
    () =>
      properties.filter((property) =>
        `${property.title} ${property.location} ${property.id}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PX</div>
          <div>
            <b>PROJECTX</b>
            <span>Operations console</span>
          </div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {sections.map((section) => (
            <button
              className={active === section ? 'nav-item active' : 'nav-item'}
              key={section}
              onClick={() => setActive(section)}
            >
              <i>{navIcons[section]}</i>
              <span>{section}</span>
              {section === 'Notifications' && <em>3</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="env">
            <span className="pulse" />
            Development snapshot
          </div>
          <div className="operator">
            <div className="avatar">AK</div>
            <div>
              <b>Admin operator</b>
              <span>Internal access</span>
            </div>
            <span className="dots">•••</span>
          </div>
        </div>
      </aside>
      <section className="main-panel">
        <header className="topbar">
          <div>
            <span className="eyebrow">INTERNAL OPERATIONS</span>
            <h1>{active}</h1>
          </div>
          <div className="top-actions">
            <div className="data-note">
              <span className="pulse" />
              Demo snapshot
            </div>
            <button className="icon-button" aria-label="Notifications">
              ◫<b>3</b>
            </button>
            <button className="help-button">?</button>
          </div>
        </header>
        <div className="content">
          {active === 'Overview' ? (
            <Overview setActive={setActive} />
          ) : active === 'Properties' ? (
            <Properties
              query={query}
              setQuery={setQuery}
              properties={filteredProperties}
            />
          ) : (
            <Placeholder section={active} setActive={setActive} />
          )}
        </div>
      </section>
    </main>
  );
}

function Overview({ setActive }: { setActive: (section: Section) => void }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Good afternoon, operator</h2>
          <p>Here is the current state of your discovery pipeline.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => setActive('Properties')}
        >
          View property inventory <span>→</span>
        </button>
      </div>
      <div className="stats-grid">
        <Stat
          label="Active properties"
          value="120"
          detail="+8 this week"
          accent="green-text"
        />
        <Stat label="Open searches" value="18" detail="6 need attention" />
        <Stat label="Calls today" value="42" detail="31 completed" />
        <Stat
          label="WhatsApp delivery"
          value="96.8%"
          detail="Last 24 hours"
          accent="green-text"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">LIVE ACTIVITY</span>
              <h3>Latest operations</h3>
            </div>
            <button
              className="text-button"
              onClick={() => setActive('Notifications')}
            >
              View all →
            </button>
          </div>
          <div className="activity-list">
            <Activity
              icon="↗"
              title="Property matched"
              detail="2 BHK apartment · HSR Layout"
              time="2m ago"
              tone="green"
            />
            <Activity
              icon="◫"
              title="WhatsApp delivered"
              detail="3 properties · Search SR-0182"
              time="8m ago"
              tone="blue"
            />
            <Activity
              icon="◌"
              title="Call completed"
              detail="Requirement captured · 04:18"
              time="14m ago"
              tone="purple"
            />
            <Activity
              icon="!"
              title="Broker response delayed"
              detail="Demo Realty 2 · 18 minutes"
              time="22m ago"
              tone="amber"
            />
          </div>
        </section>
        <section className="panel health-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">SYSTEM HEALTH</span>
              <h3>Services</h3>
            </div>
            <button
              className="text-button"
              onClick={() => setActive('System Health')}
            >
              Inspect →
            </button>
          </div>
          <Health name="API" detail="Cloud Run · 142ms" />
          <Health name="Database" detail="Supabase · 38ms" />
          <Health name="Voice boundary" detail="LiveKit adapter" />
          <Health name="WhatsApp provider" detail="Local adapter" />
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">MATCHING QUEUE</span>
            <h3>Recent high-fit properties</h3>
          </div>
          <button className="text-button" onClick={() => setActive('Matching')}>
            Open matching →
          </button>
        </div>
        <PropertyTable rows={properties.slice(0, 3)} />
      </section>
    </>
  );
}

function Activity({
  icon,
  title,
  detail,
  time,
  tone,
}: {
  icon: string;
  title: string;
  detail: string;
  time: string;
  tone: string;
}) {
  return (
    <div className="activity">
      <div className={`activity-icon ${tone}`}>{icon}</div>
      <div>
        <b>{title}</b>
        <span>{detail}</span>
      </div>
      <time>{time}</time>
    </div>
  );
}
function Health({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="health-row">
      <div>
        <b>{name}</b>
        <span>{detail}</span>
      </div>
      <Status>Operational</Status>
    </div>
  );
}
function PropertyTable({ rows }: { rows: typeof properties }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>PROPERTY</th>
            <th>LOCATION</th>
            <th>RENT</th>
            <th>MATCH</th>
            <th>STATUS</th>
            <th>BROKER</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((property) => (
            <tr key={property.id}>
              <td>
                <b>{property.title}</b>
                <span>{property.id}</span>
              </td>
              <td>{property.location}</td>
              <td>
                {property.rent}
                <small>/ month</small>
              </td>
              <td>
                <strong className="score">{property.score}%</strong>
              </td>
              <td>
                <Status tone={property.status === 'Active' ? 'green' : 'amber'}>
                  {property.status}
                </Status>
              </td>
              <td>{property.broker}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Properties({
  query,
  setQuery,
  properties: rows,
}: {
  query: string;
  setQuery: (value: string) => void;
  properties: typeof properties;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Property inventory</h2>
          <p>
            Inspect listing quality, availability, and matching performance.
          </p>
        </div>
        <button className="primary-button">+ Add property</button>
      </div>
      <div className="toolbar">
        <div className="search-box">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search properties, locations, IDs"
          />
        </div>
        <button className="filter-button">
          Status <span>⌄</span>
        </button>
        <button className="filter-button">
          Location <span>⌄</span>
        </button>
        <span className="result-count">{rows.length} of 120 properties</span>
      </div>
      <section className="panel table-panel inventory">
        <PropertyTable rows={rows} />
      </section>
    </>
  );
}
function Placeholder({
  section,
  setActive,
}: {
  section: Section;
  setActive: (section: Section) => void;
}) {
  const copy: Record<Section, [string, string]> = {
    Overview: ['', ''],
    Users: [
      'User directory is ready for API wiring.',
      'Connect the admin read model to inspect user identity and preference history.',
    ],
    Calls: [
      'Call operations are ready for API wiring.',
      'Connect transcripts and call-session telemetry to review conversations.',
    ],
    Searches: [
      'Search operations are ready for API wiring.',
      'Connect the requirement state read model to inspect active searches.',
    ],
    Properties: ['', ''],
    Brokers: [
      'Broker operations are ready for API wiring.',
      'Connect broker verification and response metrics to inspect inventory quality.',
    ],
    Notifications: [
      'Delivery operations are ready for API wiring.',
      'Connect notification records to inspect WhatsApp delivery state and retries.',
    ],
    Matching: [
      'Matching inspection is ready for API wiring.',
      'Connect score explanations to inspect hard filters and ranking decisions.',
    ],
    'System Health': [
      'System health is ready for live checks.',
      'Connect the health and observability endpoints to replace this snapshot.',
    ],
  };
  return (
    <div className="empty-state">
      <div className="empty-icon">{navIcons[section]}</div>
      <span className="eyebrow">{section.toUpperCase()}</span>
      <h2>{copy[section][0]}</h2>
      <p>{copy[section][1]}</p>
      <button
        className="secondary-button"
        onClick={() => setActive('Overview')}
      >
        Back to overview
      </button>
    </div>
  );
}
