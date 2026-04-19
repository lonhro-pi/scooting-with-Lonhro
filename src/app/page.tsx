export default function Home() {
  const highlights = [
    {
      title: "Firmware Modification (SHFW)",
      copy: "Tune field weakening, performance behavior, and ride parameters from one secure firmware control workspace.",
    },
    {
      title: "Encrypted Links (BLE + UART)",
      copy: "Connect through encrypted BLE and UART channels so firmware operations and live commands stay controlled and stable.",
    },
    {
      title: "Xiaomi + Ninebot Compatibility",
      copy: "Support Max, SNSC, ESx, M365, and M365 Pro families while exposing battery telemetry and scooter diagnostics.",
    },
  ];

  const controlFeatures = [
    "Change Region: change serial number for the connected vehicle.",
    "Commands: act on registers to enable KERS, DPC, lock, reboot, and more.",
    "Automate: send a user-specified command on connection (for example, DPC register activation).",
    "Lock: keep scooter in always-on mode while ebrake is applied to discourage theft.",
    "Cruise Control: activate time-delayed cruise control when firmware permits it.",
    "Direct power control (DPC): activate DPC register mode for switchable register or switchable brake firmware options.",
    "Always on tail light: force the tail light to remain ON.",
  ];

  const powerLimitNotes = [
    "Standard presets: Sports 25A, Drive 14A, Eco 8A (Auto profiles supported).",
    "Higher values increase power output, but excessive power is not recommended for battery or motor lifespan.",
    "Power limit does not directly change top speed.",
    "This value applies at full battery voltage; the scooter may draw more current at lower voltage to compensate.",
    "Tested values were validated on stock battery voltage, but you should still consider ambient temperature, part variance, and battery modifications.",
    "System Voltage is for estimated draw display only and does not patch firmware.",
    "Estimated draw in Sports mode: nominal 350W, peak 700W.",
  ];

  const currentLimitNotes = [
    "Standard presets: Sports 55A, Drive 28A, Eco 16A.",
    "Higher values increase power output, but too much current is not recommended for battery or motor lifespan.",
    "Current limit is the hard cap for draw. The scooter should not draw above the configured value.",
  ];

  const speedProfiles = [
    "US region - Sports 33 km/h",
    "EU region - Sports / US region - Drive 27 km/h",
    "DE region - Sports / EU region - Drive 22 km/h",
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
              Engineer your fleet stack with SHFW firmware modification tools,
              encrypted links, and maintenance-grade diagnostics inspired by
              advanced scooter utility workflows.
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
                <p className="text-zinc-200">Firmware uploads</p>
                <p className="mt-2 text-2xl font-bold">Ready</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Safe mode</p>
                <p className="mt-2 text-2xl font-bold">Ninebot</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Raw command path</p>
                <p className="mt-2 text-2xl font-bold">Enabled</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Serial updates</p>
                <p className="mt-2 text-2xl font-bold">ESC + BMS</p>
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

        <section className="mt-8 rounded-2xl border border-pink-400/25 bg-zinc-900/70 p-7">
          <h2 className="text-2xl font-bold text-white">Firmware Utility Stack</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-zinc-300 md:grid-cols-2">
            <li>• Upload firmware with guided compatibility checks.</li>
            <li>• Change serial numbers on ESC and BMS controllers.</li>
            <li>• Send commands with a simple UI or raw calculated packets.</li>
            <li>
              • Safe-mode blocks wrong firmware targets on Ninebot vehicles.
            </li>
            <li>
              • Real-time battery and scooter output for diagnostics sessions.
            </li>
            <li>
              • Built for Xiaomi-Ninebot platforms: Max, SNSC, ESx, M365,
              M365 Pro.
            </li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-pink-400/25 bg-zinc-900/70 p-7">
          <h2 className="text-2xl font-bold text-white">
            Register and Control Commands
          </h2>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-zinc-300">
            {controlFeatures.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-pink-400/25 bg-zinc-900/70 p-7">
          <h2 className="text-2xl font-bold text-white">Performance Tuning Panel</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-pink-300">Power limit</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Standard: 25A / 14A / Auto
              </p>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                {powerLimitNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-pink-300">Current limit</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Standard: 55A / 28A / 16A
              </p>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                {currentLimitNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-pink-300">Max speed</h3>
              <p className="mt-2 text-sm text-zinc-300">
                The scooter stays below configured max speed (add +1 to actually
                drive at the exact target speed).
              </p>
              <p className="mt-3 text-sm text-zinc-300">
                With stock battery voltage (36-42V), top speed typically caps
                near 33 km/h at full charge.
              </p>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                {speedProfiles.map((profile) => (
                  <li key={profile}>• {profile}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-pink-300">
                Direct power control (DPC)
              </h3>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                <li>
                  • Curve type (DPC only): throttle follows a power-based
                  algorithm similar to thermal engine behavior.
                </li>
                <li>
                  • Warning: speed limit is ignored while DPC is active.
                </li>
                <li>
                  • Current raising coefficient controls how quickly current is
                  applied for speed-based throttle response.
                </li>
                <li>
                  • Current raising coefficient is ignored while using DPC.
                </li>
                <li>
                  • Motor Start Speed defines the minimum speed in km/h before
                  motor engagement.
                </li>
              </ul>
            </article>
          </div>
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
              Join the early group for SHFW firmware modding, secure links, and
              command-level control in one Lonhro console.
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
