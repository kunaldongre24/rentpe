const foundations = [
  'API health',
  'Admin web shell',
  'Voice-agent boundary',
  'Shared TypeScript packages',
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">
              PROPERTY ASSISTANT
            </p>
            <p className="text-xs text-[var(--muted)]">Bengaluru operations</p>
          </div>
          <span className="text-sm text-[var(--muted)]">
            Phase 1 foundation
          </span>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-3 text-sm font-semibold text-[var(--accent)]">
          SYSTEM STATUS
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight">
          AI property discovery platform foundation
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          The modular monolith workspace is ready for staged implementation.
          Product workflows remain intentionally disabled until their approved
          phases.
        </p>
        <div className="mt-12 grid gap-px overflow-hidden border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
          {foundations.map((item) => (
            <div key={item} className="bg-white p-6">
              <div className="mb-4 h-2 w-2 bg-[var(--accent)]" />
              <h2 className="font-semibold">{item}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Configured and ready for later phase work.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
