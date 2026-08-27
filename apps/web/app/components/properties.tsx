'use client';

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

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`status ${value === 'ACTIVE' || value === 'completed' ? 'status-green' : 'status-amber'}`}
    >
      <span />
      {value}
    </span>
  );
}

function Empty() {
  return <div className="inline-empty">No records yet</div>;
}

export function Properties({
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
          <span>\u2315</span>
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
                    {item.bhk} BHK \u00B7 {item.furnishing.replaceAll('_', ' ')}
                  </td>
                  <td>
                    <StatusBadge value={item.status} />
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
