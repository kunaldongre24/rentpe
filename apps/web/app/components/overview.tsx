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

function scalar(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return '';
}

function text(row: Entity, key: string) {
  return scalar(row[key]) || '\u2014';
}

function date(value: unknown) {
  const input = scalar(value);
  return input
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(input))
    : '\u2014';
}

function money(value: string | number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function PropertyCards({ rows }: { rows: Property[] }) {
  if (!rows.length)
    return <div className="inline-empty">No records yet</div>;
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
              <span
                className={`status ${item.status === 'ACTIVE' ? 'status-green' : 'status-amber'}`}
              >
                <span />
                {item.status}
              </span>
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

export function Overview({
  data,
  setActive,
}: {
  data: {
    properties: Property[];
    brokers: Entity[];
    calls: Entity[];
    searches: Entity[];
  };
  setActive: (value: string) => void;
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
              View all \u2192
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
              <div className="activity-icon purple">\u25CC</div>
              <div>
                <b>{text(call, 'status')}</b>
                <span>{text(call, 'provider')}</span>
              </div>
              <time>{date(call.started_at)}</time>
            </div>
          ))}
          {data.calls.length === 0 && (
            <div className="inline-empty">No records yet</div>
          )}
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
