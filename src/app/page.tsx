export default function Home() {
  const highlights = [
    {
      title: "Smooth Fleet",
      copy: "High-performance scooters with reliable range, quick charge cycles, and premium comfort.",
    },
    {
      title: "City Route IQ",
      copy: "Smart route planning balances terrain, traffic, and battery to keep every ride efficient.",
    },
    {
      title: "Rider Community",
      copy: "Track milestones, join city challenges, and ride with the Lonhro squad every weekend.",
    },
  ];

  return (
    <div className="flex flex-1 justify-center px-6 py-10 md:px-10 md:py-14">
      <main className="w-full max-w-6xl rounded-3xl border border-white/10 bg-white/95 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.2)] backdrop-blur md:p-12">
        <section className="grid gap-10 lg:grid-cols-[1.25fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-sm font-semibold text-sky-700">
              Urban mobility, elevated.
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
              Scooting with Lonhro
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Premium city scooting built for speed, style, and smart planning.
              Launch rides in seconds, discover scenic routes, and unlock
              community-powered momentum.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#features"
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Explore Features
              </a>
              <a
                href="#launch"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:text-sky-700"
              >
                Start Your Ride
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-700 p-6 text-white shadow-xl">
            <h2 className="text-lg font-semibold">Today&apos;s Ride Snapshot</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-slate-200">Live scooters</p>
                <p className="mt-2 text-2xl font-bold">128</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-slate-200">Avg. range</p>
                <p className="mt-2 text-2xl font-bold">42 km</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-slate-200">Active riders</p>
                <p className="mt-2 text-2xl font-bold">3.7k</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-slate-200">Battery health</p>
                <p className="mt-2 text-2xl font-bold">97%</p>
              </div>
            </div>
          </div>
        </div>
        </section>

        <section id="features" className="mt-14 grid gap-5 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.copy}</p>
            </article>
          ))}
        </section>

        <section
          id="launch"
          className="mt-14 rounded-2xl border border-sky-200 bg-sky-50 p-7 md:flex md:items-center md:justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Ready to roll?</h2>
            <p className="mt-2 text-slate-600">
              Create your rider profile and unlock your first Lonhro route.
            </p>
          </div>
          <button
            type="button"
            className="mt-5 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 md:mt-0"
          >
            Join the Launch List
          </button>
        </section>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          Built with velocity by Lonhro Labs.
        </div>
      </main>
    </div>
  );
}
