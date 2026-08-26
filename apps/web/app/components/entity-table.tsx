type Entity = Record<string, unknown>;

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

function Empty() {
  return <div className="inline-empty">No records yet</div>;
}

export function EntityTable({
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
