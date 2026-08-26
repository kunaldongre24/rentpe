'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../lib/supabase-browser';
import { Login } from './login';
import { Overview } from './components/overview';
import { Properties } from './components/properties';
import { ListingForm } from './components/listing-form';
import { EntityTable } from './components/entity-table';

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
  Overview: '\u2302',
  Properties: '\u25A6',
  'Add listing': '+',
  Brokers: '\u25C6',
  Calls: '\u25CC',
  Searches: '\u2315',
  Users: '\u25C9',
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
