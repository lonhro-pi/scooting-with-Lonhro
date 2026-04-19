export default function Home() {
  const highlights = [
    {
      title: "Firmware Studio",
      copy: "Build, validate, and deploy signed firmware packs with staged release channels for each scooter family.",
    },
    {
      title: "Scooter Profile Manager",
      copy: "Tune acceleration maps, battery curves, and braking behavior through profile templates and one-click presets.",
    },
    {
      title: "Diagnostics + Recovery",
      copy: "Run health scans, compare controller logs, and trigger safe rollback snapshots when firmware checks fail.",
    },
  ];

  return (
    <div className="flex flex-1 justify-center px-6 py-10 md:px-10 md:py-14">
      <main className="w-full max-w-6xl rounded-3xl border border-pink-400/20 bg-zinc-950/95 p-8 text-zinc-100 shadow-[0_35px_90px_rgba(236,72,153,0.18)] backdrop-blur md:p-12">
        <section className="grid gap-10 lg:grid-cols-[1.25fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full border border-pink-400/40 bg-pink-500/10 px-4 py-1 text-sm font-semibold text-pink-300">
              Matte black core. Deep pink precision.
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Scooting with Lonhro Control Suite
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-300">
              Engineer your fleet stack with firmware orchestration, performance
              profile switching, and maintenance-grade diagnostics inspired by
              modern scooter utility workflows.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#features"
                className="rounded-xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-500"
              >
                Open Utility Roadmap
              </a>
              <a
                href="#launch"
                className="rounded-xl border border-zinc-600 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-pink-400 hover:text-pink-300"
              >
                Request Beta Access
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-pink-400/30 bg-gradient-to-br from-zinc-950 via-zinc-900 to-pink-800 p-6 text-white shadow-xl">
            <h2 className="text-lg font-semibold">Live Firmware Operations</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Supported profiles</p>
                <p className="mt-2 text-2xl font-bold">34</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Firmware channels</p>
                <p className="mt-2 text-2xl font-bold">6</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Rollback snapshots</p>
                <p className="mt-2 text-2xl font-bold">1,482</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Telemetry uptime</p>
                <p className="mt-2 text-2xl font-bold">99.98%</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-14 grid gap-5 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-pink-300">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{item.copy}</p>
            </article>
          ))}
        </section>

        <section
          id="launch"
          className="mt-14 rounded-2xl border border-pink-400/30 bg-zinc-900 p-7 md:flex md:items-center md:justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-white">
              Build your scooter utility stack
            </h2>
            <p className="mt-2 text-zinc-300">
              Join the early group for secure firmware tooling, profile control,
              and advanced diagnostics in one Lonhro console.
            </p>
          </div>
          <button
            type="button"
            className="mt-5 rounded-xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-500 md:mt-0"
          >
            Join Firmware Beta
          </button>
        </section>

        <div className="mt-10 border-t border-zinc-800 pt-6 text-sm text-zinc-400">
          Built by Lonhro Labs for next-generation scooter utility software.
        </div>
      </main>
    </div>
  );
}
