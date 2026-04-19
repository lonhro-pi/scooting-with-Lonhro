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
    "Region Switch lets you remap the active vehicle profile and rewrite serial identity for connected controllers.",
    "Command Console gives direct register actions for KERS, DPC, lock state, reboot, and additional low-level toggles.",
    "Auto-Run can trigger a selected startup command on connect, such as immediate DPC register enablement.",
    "Security Lock keeps the scooter in powered lock state and applies e-brake pressure to reduce theft risk.",
    "Cruise Assist enables delayed cruise engagement when the installed firmware configuration allows it.",
    "DPC Register Mode supports switchable register and switchable brake variants for firmware-ready builds.",
    "Tail Light Persistent mode keeps rear lighting continuously active for high-visibility sessions.",
  ];

  const powerLimitNotes = [
    "Reference profiles: Sport 25A, Drive 14A, Eco 8A, with adaptive auto-profile support.",
    "Increasing this value raises acceleration output, but aggressive settings can shorten battery and motor service life.",
    "Power limit calibration shapes torque behavior and does not directly set final top speed.",
    "Limits are calculated at full battery voltage. At lower voltage, current draw may rise to maintain requested power.",
    "Validated values come from stock voltage testing, but heat, component variance, and battery mods still change safe margins.",
    "System Voltage is display-side estimation only and does not write a firmware patch.",
    "Sport-mode draw estimate: ~350W nominal and ~700W burst peak.",
  ];

  const currentLimitNotes = [
    "Reference profiles: Sport 55A, Drive 28A, Eco 16A.",
    "Higher current limits deliver stronger response, but sustained high values can increase thermal and battery wear.",
    "This parameter acts as the hard draw ceiling for the controller path.",
  ];

  const speedProfiles = [
    "US region - Sports 33 km/h",
    "EU region - Sports / US region - Drive 27 km/h",
    "DE region - Sports / EU region - Drive 22 km/h",
  ];

  const brakeNotes = [
    "Brake lever baseline ships with virtual limit 120, minimum phase current 6A, and maximum phase current 35A.",
    "KERS start threshold defaults to 6 km/h with a configurable 0-10 km/h operating window.",
    "At 0 km/h threshold, passive motor-off braking stays disabled while lever-based regenerative braking remains available.",
    "Brake current ramp coefficient defines how quickly braking force is introduced during initial lever input.",
    "Brake light behavior can be tuned with mode selection and flash-frequency controls.",
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
                Baseline profile: 25A / 14A / Auto
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
                Baseline profile: 55A / 28A / 16A
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
                Speed cap keeps ride velocity below the configured target. Add +1
                km/h offset when you want exact real-world matching.
              </p>
              <p className="mt-3 text-sm text-zinc-300">
                On stock 36-42V packs, real top speed usually settles near 33
                km/h on full charge.
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
                  • DPC curve mode shifts throttle logic to a power-weighted map,
                  closer to engine-style response behavior.
                </li>
                <li>
                  • Safety notice: active DPC can bypass standard speed-limit
                  enforcement.
                </li>
                <li>
                  • Current ramp coefficient controls how quickly drive current
                  is injected during throttle rise.
                </li>
                <li>
                  • In DPC mode, this ramp coefficient is not used.
                </li>
                <li>
                  • Motor start threshold defines minimum rolling speed (km/h)
                  before assisted drive engagement.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-pink-400/25 bg-zinc-900/70 p-7">
          <h2 className="text-2xl font-bold text-white">
            Brake and KERS Tuning
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-pink-300">
                Brake lever params
              </h3>
              <p className="mt-2 text-sm text-zinc-300">
                Baseline: 120 / 6A / 35A
              </p>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                <li>• Virtual lever ceiling: 120</li>
                <li>• Phase current floor: 6A</li>
                <li>• Phase current ceiling: 35A</li>
                <li>• Response slider spans softer-to-aggressive sensitivity.</li>
              </ul>
            </article>

            <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-pink-300">KERS Min Speed</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Sets when passive braking begins while throttle drive is inactive.
              </p>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                <li>• Recommended default: 6 km/h</li>
                <li>• Adjustable range: 0 km/h to 10 km/h</li>
                <li>
                  • At 0 km/h, passive brake engagement is disabled, while lever
                  recuperation remains active and smooth.
                </li>
              </ul>
            </article>
          </div>

          <article className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
            <h3 className="text-lg font-semibold text-pink-300">
              Brake response and lighting
            </h3>
            <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
              {brakeNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </article>
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
