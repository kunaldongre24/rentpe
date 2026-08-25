'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../lib/supabase-browser';
import { Login } from './login';

type Section =
  | 'Overview'
  | 'Properties'
  | 'Add listing'
  | 'Brokers'
  | 'Calls'
  | 'Searches'
  | 'Users';
type Entity = Record<string, unknown>;

type Property = Entity & {
  id: string;
  title: string;
  city: string;
  locality: string;
  rent: string | number;
  bhk: number;
  status: string;
  furnishing: string;
  created_at: string;
};

type DashboardData = {
  properties: Property[];
  brokers: Entity[];
  locations: Entity[];
  calls: Entity[];
  searches: Entity[];
  users: Entity[];
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const sections: Section[] = [
  'Overview',
  'Properties',
  'Add listing',
  'Brokers',
  'Calls',
  'Searches',
  'Users',
];
const icons: Record<Section, string> = {
  Overview: '⌂',
  Properties: '▦',
  'Add listing': '+',
  Brokers: '◆',
  Calls: '◌',
  Searches: '⌕',
  Users: '◉',
};
const emptyData: DashboardData = {
  properties: [],
  brokers: [],
  locations: [],
  calls: [],
  searches: [],
  users: [],
};

async function api<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiUrl}/api${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function money(value: string | number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}
function scalar(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return '';
}
function date(value: unknown) {
  const input = scalar(value);
  return input
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(input))
    : '—';
}
function text(row: Entity, key: string) {
  return scalar(row[key]) || '—';
}

export default function HomePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>();
  const [active, setActive] = useState<Section>('Overview');
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }
    void supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      setSession(nextSession),
    );
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const load = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const result = await api<DashboardData>(
        '/dashboard/operations',
        session.access_token,
      );
      setData(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to load operations data',
      );
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void load();
  }, [load]);
  const filtered = useMemo(
    () =>
      data.properties.filter((item) =>
        `${item.title} ${item.city} ${item.locality} ${item.id}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [data.properties, query],
  );

  if (session === undefined)
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <b>Loading RentPe...</b>
        </div>
      </main>
    );
  if (!supabase)
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <h1>Dashboard authentication is not configured</h1>
          <p>Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
        </div>
      </main>
    );
  if (!session)
    return (
      <Login
        onSubmit={async (email, password) => {
          const { error: signInError } = await supabase.auth.signInWithPassword(
            { email, password },
          );
          if (signInError) throw signInError;
        }}
      />
    );

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">RP</div>
          <div>
            <b>RentPe</b>
            <span>Property operations</span>
          </div>
        </div>
        <span className="workspace-label">OPERATIONS</span>
        <nav>
          {sections.map((section) => (
            <button
              key={section}
              className={active === section ? 'nav-item active' : 'nav-item'}
              onClick={() => setActive(section)}
            >
              <i>{icons[section]}</i>
              <span>{section}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="env">
            <span className="pulse" />
            Live API workspace
          </div>
          <div className="operator">
            <div className="avatar">AD</div>
            <div>
              <b>Admin console</b>
              <span>Restricted access required</span>
            </div>
          </div>
        </div>
      </aside>
      <section className="main-panel">
        <header className="topbar">
          <div>
            <span className="eyebrow">RENTPE CONTROL CENTER</span>
            <h1>{active}</h1>
          </div>
          <div className="top-actions">
            <span className="data-note">
              <span className="pulse" />
              {loading ? 'Syncing' : 'Live data'}
            </span>
            <button
              className="secondary-button"
              onClick={() => void supabase.auth.signOut()}
            >
              Sign out
            </button>
            <button className="secondary-button" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </header>
        <div className="content">
          {error && (
            <div className="alert">
              <b>Unable to load data.</b> {error}
            </div>
          )}
          {active === 'Overview' && (
            <Overview data={data} setActive={setActive} />
          )}
          {active === 'Properties' && (
            <Properties
              rows={filtered}
              query={query}
              setQuery={setQuery}
              reload={load}
              token={session.access_token}
            />
          )}
          {active === 'Add listing' && (
            <ListingForm
              brokers={data.brokers}
              locations={data.locations}
              onCreated={async () => {
                await load();
                setActive('Properties');
              }}
              token={session.access_token}
            />
          )}
          {active === 'Brokers' && (
            <EntityTable
              title="Broker directory"
              rows={data.brokers}
              columns={[
                'name',
                'company',
                'phone',
                'verification_status',
                'active',
              ]}
            />
          )}
          {active === 'Calls' && (
            <EntityTable
              title="Recent calls"
              rows={data.calls}
              columns={[
                'provider',
                'provider_call_id',
                'status',
                'started_at',
                'duration_seconds',
              ]}
            />
          )}
          {active === 'Searches' && (
            <EntityTable
              title="Property searches"
              rows={data.searches}
              columns={[
                'intent',
                'city',
                'locality',
                'bhk',
                'max_rent',
                'status',
              ]}
            />
          )}
          {active === 'Users' && (
            <EntityTable
              title="Caller directory"
              rows={data.users}
              columns={['phone', 'name', 'whatsapp_number', 'created_at']}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function Overview({
  data,
  setActive,
}: {
  data: DashboardData;
  setActive: (value: Section) => void;
}) {
  const activeProperties = data.properties.filter(
    (item) => item.status === 'ACTIVE',
  ).length;
  const completedCalls = data.calls.filter(
    (item) => item.status === 'completed',
  ).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Marketplace operations at a glance</h2>
          <p>
            Live inventory, caller demand, listing partners, and call activity.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setActive('Add listing')}
        >
          + Add property
        </button>
      </div>
      <div className="stats-grid">
        <Stat
          label="Active properties"
          value={String(activeProperties)}
          detail={`${data.properties.length} total listings`}
        />
        <Stat
          label="Open searches"
          value={String(
            data.searches.filter((item) => item.status === 'ACTIVE').length,
          )}
          detail="Current renter demand"
        />
        <Stat
          label="Calls tracked"
          value={String(data.calls.length)}
          detail={`${completedCalls} completed`}
        />
        <Stat
          label="Listing partners"
          value={String(data.brokers.length)}
          detail="Brokers and owners"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">LATEST INVENTORY</span>
              <h3>Recently added properties</h3>
            </div>
            <button
              className="text-button"
              onClick={() => setActive('Properties')}
            >
              View all →
            </button>
          </div>
          <PropertyCards rows={data.properties.slice(0, 4)} />
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">RECENT CALLS</span>
              <h3>Voice activity</h3>
            </div>
          </div>
          {data.calls.slice(0, 6).map((call) => (
            <div className="activity" key={text(call, 'id')}>
              <div className="activity-icon purple">◌</div>
              <div>
                <b>{text(call, 'status')}</b>
                <span>{text(call, 'provider')}</span>
              </div>
              <time>{date(call.started_at)}</time>
            </div>
          ))}
          {data.calls.length === 0 && <Empty />}
        </section>
      </div>
    </>
  );
}
function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
function Empty() {
  return <div className="inline-empty">No records yet</div>;
}
function Status({ value }: { value: string }) {
  return (
    <span
      className={`status ${value === 'ACTIVE' || value === 'completed' ? 'status-green' : 'status-amber'}`}
    >
      <span />
      {value}
    </span>
  );
}

function PropertyCards({ rows }: { rows: Property[] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="property-cards">
      {rows.map((item) => (
        <article className="property-card" key={item.id}>
          <div className="property-photo">
            <span>{item.bhk} BHK</span>
          </div>
          <div className="property-card-body">
            <div className="property-card-top">
              <b>{item.title}</b>
              <Status value={item.status} />
            </div>
            <p>
              {item.locality}, {item.city}
            </p>
            <strong>
              {money(item.rent)}
              <small> / month</small>
            </strong>
            <div className="property-meta">
              <span>{item.furnishing.replaceAll('_', ' ')}</span>
              <span>Listed {date(item.created_at)}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
function Properties({
  rows,
  query,
  setQuery,
  reload,
  token,
}: {
  rows: Property[];
  query: string;
  setQuery: (value: string) => void;
  reload: () => Promise<void>;
  token: string;
}) {
  async function setStatus(id: string, status: string) {
    await api(`/partner/properties/${id}/status`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await reload();
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Property inventory</h2>
          <p>Review, activate, pause, and manage rental listings.</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-box">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, locality, city, or ID"
          />
        </div>
        <span className="result-count">{rows.length} listings</span>
      </div>
      <section className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PROPERTY</th>
                <th>LOCATION</th>
                <th>RENT</th>
                <th>DETAILS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.title}</b>
                    <span>{item.id.slice(0, 8)}</span>
                  </td>
                  <td>
                    {item.locality}, {item.city}
                  </td>
                  <td>{money(item.rent)}</td>
                  <td>
                    {item.bhk} BHK · {item.furnishing.replaceAll('_', ' ')}
                  </td>
                  <td>
                    <Status value={item.status} />
                  </td>
                  <td className="row-actions">
                    <button
                      onClick={() =>
                        void setStatus(
                          item.id,
                          item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
                        )
                      }
                    >
                      {item.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty />}
        </div>
      </section>
    </>
  );
}

function EntityTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: Entity[];
  columns: string[];
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>{title}</h2>
          <p>Live records from the RentPe backend.</p>
        </div>
      </div>
      <section className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column.replaceAll('_', ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={text(row, 'id') + index}>
                  {columns.map((column) => (
                    <td key={column}>
                      {column.includes('at')
                        ? date(row[column])
                        : text(row, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty />}
        </div>
      </section>
    </>
  );
}

function ListingForm({
  brokers,
  locations,
  onCreated,
  token,
}: {
  brokers: Entity[];
  locations: Entity[];
  onCreated: () => Promise<void>;
  token: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const location = locations.find((item) => item.id === values.locationId);
    const payload = {
      ...values,
      bhk: Number(values.bhk),
      rent: Number(values.rent),
      deposit: values.deposit ? Number(values.deposit) : null,
      area: Number(values.area),
      floor: values.floor ? Number(values.floor) : null,
      totalFloors: values.totalFloors ? Number(values.totalFloors) : null,
      latitude: Number(location?.latitude ?? 0),
      longitude: Number(location?.longitude ?? 0),
      parking: values.parking === 'on',
      balcony: Number(values.balcony ?? 0),
      amenities: scalar(values.amenities)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      status: 'DRAFT',
      qualityScore: 0,
      freshnessScore: 100,
    };
    try {
      await api('/partner/properties', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await onCreated();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to create listing',
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>List a rental property</h2>
          <p>
            Create a verified draft for admin review. Images are added after
            secure object storage is configured.
          </p>
        </div>
      </div>
      <form
        className="listing-form panel"
        onSubmit={(event) => void submit(event)}
      >
        {error && <div className="alert">{error}</div>}
        <fieldset>
          <legend>Partner and location</legend>
          <label>
            Broker or owner
            <select name="brokerId" required defaultValue="">
              <option value="" disabled>
                Select partner
              </option>
              {brokers.map((item) => (
                <option value={text(item, 'id')} key={text(item, 'id')}>
                  {text(item, 'name')} · {text(item, 'company')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <select name="locationId" required defaultValue="">
              <option value="" disabled>
                Select locality
              </option>
              {locations.map((item) => (
                <option value={text(item, 'id')} key={text(item, 'id')}>
                  {text(item, 'name')}, {text(item, 'city')}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        <fieldset>
          <legend>Property details</legend>
          <label className="wide">
            Listing title
            <input
              name="title"
              required
              maxLength={300}
              placeholder="Spacious 2 BHK near 27th Main"
            />
          </label>
          <label>
            Type
            <select name="propertyType" defaultValue="apartment">
              <option value="apartment">Apartment</option>
              <option value="independent_house">Independent house</option>
              <option value="villa">Villa</option>
              <option value="studio">Studio</option>
            </select>
          </label>
          <label>
            BHK
            <input name="bhk" type="number" min="1" max="20" required />
          </label>
          <label>
            Furnishing
            <select name="furnishing" defaultValue="semi_furnished">
              <option value="unfurnished">Unfurnished</option>
              <option value="semi_furnished">Semi-furnished</option>
              <option value="fully_furnished">Fully furnished</option>
            </select>
          </label>
          <label>
            Area (sq ft)
            <input name="area" type="number" min="1" required />
          </label>
          <label>
            Monthly rent
            <input name="rent" type="number" min="0" required />
          </label>
          <label>
            Deposit
            <input name="deposit" type="number" min="0" />
          </label>
          <label>
            Available from
            <input name="availableFrom" type="date" required />
          </label>
          <label>
            Floor
            <input name="floor" type="number" min="0" />
          </label>
          <label>
            Total floors
            <input name="totalFloors" type="number" min="0" />
          </label>
          <label>
            Balconies
            <input name="balcony" type="number" min="0" defaultValue="0" />
          </label>
          <label className="check">
            <input name="parking" type="checkbox" /> Parking available
          </label>
        </fieldset>
        <fieldset>
          <legend>Address and highlights</legend>
          <label>
            Locality
            <input name="locality" required />
          </label>
          <label>
            City
            <input name="city" required />
          </label>
          <label className="wide">
            Full address
            <textarea name="address" required rows={3} />
          </label>
          <label className="wide">
            Description
            <textarea
              name="description"
              required
              rows={5}
              placeholder="Describe layout, surroundings, availability, and key terms without exaggeration."
            />
          </label>
          <label className="wide">
            Amenities
            <input
              name="amenities"
              placeholder="Lift, power backup, gym, security"
            />
          </label>
        </fieldset>
        <div className="form-actions">
          <span>Listings start as drafts and require admin activation.</span>
          <button className="primary-button" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save draft'}
          </button>
        </div>
      </form>
    </>
  );
}
