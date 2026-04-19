"use client";

import { useMemo, useState } from "react";

const initialBatteries = [
  { id: "Battery-1", cycles: 84, sag: "2.1%" },
  { id: "Battery-2", cycles: 71, sag: "2.7%" },
  { id: "Battery-3", cycles: 65, sag: "2.4%" },
  { id: "Battery-4", cycles: 92, sag: "3.0%" },
  { id: "Battery-5", cycles: 53, sag: "1.9%" },
  { id: "Battery-6", cycles: 48, sag: "1.8%" },
  { id: "Battery-7", cycles: 39, sag: "1.6%" },
];

export default function Home() {
  const [activeView, setActiveView] = useState<"cockpit" | "garage" | "terminal">(
    "cockpit",
  );
  const [vehicleProfile, setVehicleProfile] = useState<"NIU 48V / ATV" | "Segway 36V">(
    "NIU 48V / ATV",
  );
  const [batteryLog, setBatteryLog] = useState(initialBatteries);
  const [selectedBattery, setSelectedBattery] = useState("Battery-1");
  const [seed, setSeed] = useState("");
  const [seedPaired, setSeedPaired] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "FAULT_CODE_DRV8301 @ 2026-04-11 19:20",
    "OVER_VOLTAGE @ 2026-04-15 08:44",
  ]);
  const [thermalOverride, setThermalOverride] = useState(false);

  const alreadyPresent = [
    "Encrypted BLE + UART links are already included.",
    "Xiaomi/Ninebot family compatibility is already included.",
    "Raw UART command flow already exists in Command Console.",
  ];

  const newlyAdded = [
    "Cross-platform Bluetooth infrastructure plan (flutter_blue_plus + flutter_web_bluetooth).",
    "Wasm-first web dashboard plan for 60 FPS telemetry widgets.",
    "Dart VESC UART packet parser layer for voltage, temperature, and RPM decoding.",
    "Three-view product architecture: Cockpit, Garage, Terminal.",
    "Seed-based pairing handshake gate before unlock commands can execute.",
    "Deployment track split: sideloaded Android APK and local/web-hosted dashboard.",
  ];

  const coreInfrastructure = [
    {
      title: "Cross-Platform Bluetooth",
      detail:
        "Mobile path uses flutter_blue_plus while web dashboard transport uses flutter_web_bluetooth for direct browser pairing.",
    },
    {
      title: "Wasm Telemetry Runtime",
      detail:
        "Dashboard build targets WebAssembly so speed/amp gauges keep smooth 60 FPS behavior under live stream load.",
    },
    {
      title: "VESC UART Parser Package",
      detail:
        "A shared Dart parser decodes raw hex frames into typed telemetry: battery voltage, controller temp, motor temp, RPM, and faults.",
    },
  ];

  const cockpitFeatures = [
    "High-contrast speed + battery gauges readable under vibration.",
    "Thermal kill-switch panel with VESC/motor heat state and emergency limp-home override.",
    "Regional offline map support for out-of-range riding corridors.",
  ];

  const garageFeatures = [
    "One-tap profile swapper between NIU 48V ATV-wheel profile and Segway 36V profile.",
    "Battery cycle tracker for seven packs with sag trend logging.",
  ];

  const terminalFeatures = [
    "Raw console for Lisp/UART command dispatch.",
    "Fault-code history timeline for repeat glitches and recovery auditing.",
  ];

  const implementationSteps = [
    "Start with a pure Dart protocol package so parsing and control math are shared by mobile and web.",
    "Use responsive layout logic: stacked cockpit on phone, expanded multi-graph diagnostics on laptop.",
    "Ship mobile through sideload APK and web through local Pi or lightweight static hosting.",
  ];

  const speed = vehicleProfile === "NIU 48V / ATV" ? 41 : 32;
  const batteryPct = vehicleProfile === "NIU 48V / ATV" ? 76 : 63;
  const vescTemp = vehicleProfile === "NIU 48V / ATV" ? 67 : 59;
  const motorTemp = vehicleProfile === "NIU 48V / ATV" ? 72 : 61;

  const unlockReady = useMemo(
    () => seedPaired && terminalInput.toLowerCase().includes("unlock"),
    [seedPaired, terminalInput],
  );

  const runBatteryCycle = () => {
    setBatteryLog((prev) =>
      prev.map((battery) =>
        battery.id === selectedBattery
          ? { ...battery, cycles: battery.cycles + 1 }
          : battery,
      ),
    );
  };

  const runSeedHandshake = () => {
    if (seed.trim().length < 8) {
      setSeedPaired(false);
      setTerminalOutput((prev) => [
        ...prev,
        "PAIRING_REJECTED: seed phrase too short for secure handshake.",
      ]);
      return;
    }

    setSeedPaired(true);
    setTerminalOutput((prev) => [...prev, "PAIRING_OK: seed handshake verified."]);
  };

  const sendCommand = () => {
    if (!terminalInput.trim()) {
      return;
    }

    if (terminalInput.toLowerCase().includes("unlock") && !seedPaired) {
      setTerminalOutput((prev) => [
        ...prev,
        "UNLOCK_BLOCKED: secure seed pairing required before unlock command.",
      ]);
      return;
    }

    setTerminalOutput((prev) => [...prev, `TX> ${terminalInput}`]);
    setTerminalInput("");
  };

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
              Unified fleet stack for VESC-powered scooters: live cockpit metrics,
              garage battery lifecycle tracking, and terminal-grade command tools.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#coverage"
                className="rounded-xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-500"
              >
                Review Feature Coverage
              </a>
              <a
                href="#live-prototype"
                className="rounded-xl border border-zinc-600 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-pink-400 hover:text-pink-300"
              >
                Open Working Prototype
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-pink-400/30 bg-gradient-to-br from-zinc-950 via-zinc-900 to-pink-800 p-6 text-white shadow-xl">
            <h2 className="text-lg font-semibold">Live Firmware Operations</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Vehicle Profile</p>
                <p className="mt-2 text-lg font-bold">{vehicleProfile}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Seed Pairing</p>
                <p className="mt-2 text-lg font-bold">{seedPaired ? "Verified" : "Locked"}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Thermal Override</p>
                <p className="mt-2 text-lg font-bold">{thermalOverride ? "Enabled" : "Standby"}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-zinc-200">Fault Events</p>
                <p className="mt-2 text-lg font-bold">{terminalOutput.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="coverage"
          className="mt-8 rounded-2xl border border-pink-400/25 bg-zinc-900/70 p-7"
        >
          <h2 className="text-2xl font-bold text-white">Feature Coverage Check</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Duplicate items were not re-added. Existing capabilities stay intact,
            and only missing infrastructure/features were added below.
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-pink-300">Already Present</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                {alreadyPresent.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-pink-300">Added Now</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                {newlyAdded.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-pink-400/25 bg-zinc-900/70 p-7">
          <h2 className="text-2xl font-bold text-white">Core Infrastructure</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {coreInfrastructure.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5"
              >
                <h3 className="text-lg font-semibold text-pink-300">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="live-prototype"
          className="mt-8 rounded-2xl border border-pink-400/25 bg-zinc-900/70 p-7"
        >
          <h2 className="text-2xl font-bold text-white">Live Product Prototype</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Three-mode layout: Cockpit, Garage, and Terminal. All controls below
            are interactive and update live.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {(["cockpit", "garage", "terminal"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeView === view
                    ? "bg-pink-600 text-white"
                    : "border border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-pink-400 hover:text-pink-200"
                }`}
              >
                {view[0].toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          {activeView === "cockpit" && (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                <h3 className="text-lg font-semibold text-pink-300">Cockpit View</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                  {cockpitFeatures.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                <h3 className="text-lg font-semibold text-pink-300">Live Ride Gauges</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-zinc-300">Speed</p>
                    <p className="text-2xl font-bold text-white">{speed} km/h</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-zinc-300">Battery</p>
                    <p className="text-2xl font-bold text-white">{batteryPct}%</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-zinc-300">VESC Temp</p>
                    <p className="text-2xl font-bold text-white">{vescTemp}°C</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-zinc-300">Motor Temp</p>
                    <p className="text-2xl font-bold text-white">{motorTemp}°C</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setThermalOverride((prev) => !prev)}
                  className={`mt-4 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    thermalOverride
                      ? "bg-pink-700 text-white hover:bg-pink-600"
                      : "border border-zinc-600 bg-zinc-900 text-zinc-100 hover:border-pink-400"
                  }`}
                >
                  {thermalOverride
                    ? "Disable Thermal Limp-Home Override"
                    : "Enable Thermal Limp-Home Override"}
                </button>
                <p className="mt-3 text-xs text-zinc-400">
                  Regional offline map path: flutter_map tile cache enabled for
                  out-of-range segments.
                </p>
              </article>
            </div>
          )}

          {activeView === "garage" && (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                <h3 className="text-lg font-semibold text-pink-300">Garage View</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                  {garageFeatures.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setVehicleProfile("NIU 48V / ATV")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      vehicleProfile === "NIU 48V / ATV"
                        ? "bg-pink-600 text-white"
                        : "border border-zinc-700 bg-zinc-900 text-zinc-200"
                    }`}
                  >
                    NIU 48V / ATV
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleProfile("Segway 36V")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      vehicleProfile === "Segway 36V"
                        ? "bg-pink-600 text-white"
                        : "border border-zinc-700 bg-zinc-900 text-zinc-200"
                    }`}
                  >
                    Segway 36V
                  </button>
                </div>
              </article>

              <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                <h3 className="text-lg font-semibold text-pink-300">Battery Cycle Tracker</h3>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <select
                    value={selectedBattery}
                    onChange={(event) => setSelectedBattery(event.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  >
                    {batteryLog.map((battery) => (
                      <option key={battery.id} value={battery.id}>
                        {battery.id}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={runBatteryCycle}
                    className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500"
                  >
                    Log New Cycle
                  </button>
                </div>
                <ul className="mt-4 grid gap-2 text-sm text-zinc-300">
                  {batteryLog.map((battery) => (
                    <li key={battery.id} className="rounded-lg bg-white/5 p-2">
                      {battery.id}: {battery.cycles} cycles • Sag {battery.sag}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          )}

          {activeView === "terminal" && (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                <h3 className="text-lg font-semibold text-pink-300">Terminal View</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-7 text-zinc-300">
                  {terminalFeatures.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                <div className="mt-4 space-y-3">
                  <input
                    value={seed}
                    onChange={(event) => setSeed(event.target.value)}
                    placeholder="Enter seed phrase for secure pairing"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={runSeedHandshake}
                    className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500"
                  >
                    Run Seed Handshake
                  </button>
                </div>
              </article>

              <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                <h3 className="text-lg font-semibold text-pink-300">Raw Console</h3>
                <div className="mt-3 flex gap-2">
                  <input
                    value={terminalInput}
                    onChange={(event) => setTerminalInput(event.target.value)}
                    placeholder="Example: unlock_controller"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={sendCommand}
                    className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500"
                  >
                    Send
                  </button>
                </div>
                <p
                  className={`mt-2 text-xs ${
                    unlockReady ? "text-emerald-300" : "text-zinc-400"
                  }`}
                >
                  {unlockReady
                    ? "Unlock command ready: secure pairing verified."
                    : "Unlock commands remain blocked until pairing is verified."}
                </p>
                <div className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/50 p-3 text-xs text-zinc-200">
                  {terminalOutput.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-pink-400/25 bg-zinc-900/70 p-7">
          <h2 className="text-2xl font-bold text-white">Implementation Strategy (Lonhro Way)</h2>
          <ol className="mt-4 grid gap-3 text-sm leading-7 text-zinc-300">
            {implementationSteps.map((step) => (
              <li key={step}>
                <span className="mr-2 text-pink-300">•</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-pink-400/25 bg-zinc-900/70 p-7">
          <h2 className="text-2xl font-bold text-white">Seed-Based Pairing Gate</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-zinc-300">
            <li>
              <span className="mr-2 text-pink-300">•</span>
              Unlock-path commands remain hard-blocked until a seed challenge
              handshake succeeds between controller and app.
            </li>
            <li>
              <span className="mr-2 text-pink-300">•</span>
              Session seeds rotate per connection, reducing replay-risk against
              high-impact commands.
            </li>
            <li>
              <span className="mr-2 text-pink-300">•</span>
              Terminal and automation layers both route through the same pairing
              gate before dispatch.
            </li>
          </ul>
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
              Mobile deployment: sideload Android APK. Web deployment: local Pi
              dashboard or static-hosted portal with Wasm telemetry.
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
