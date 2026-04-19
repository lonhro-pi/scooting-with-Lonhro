This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Phase 1 Link Stack (Lonhro)

Phase 1 adds a real backend integration path for telemetry:

- Mosquitto (MQTT broker)
- InfluxDB (time-series storage)
- Grafana (dashboard visualization)
- Python bridge (`services/bridge_listener.py`) to ingest MQTT payloads and write to InfluxDB

### Files added

- `infra/docker-compose.phase1.yml`
- `infra/mosquitto/mosquitto.conf`
- `services/bridge_listener.py`
- `services/.env.example`
- `scripts/publish_sample_telemetry.py`
- `scripts/mock_bridge_e2e_test.py`

### 1) Run on Raspberry Pi (Docker)

From repo root:

1. Create MQTT password file from example:
   - Copy `infra/mosquitto/passwords.example` to `infra/mosquitto/passwords`
   - Replace credentials with secure values
2. Start stack:
   - `docker compose -f infra/docker-compose.phase1.yml up -d`
3. Verify services:
   - `docker compose -f infra/docker-compose.phase1.yml ps`

### 2) Configure bridge listener

1. Copy `services/.env.example` to `services/.env`
2. Set:
   - MQTT broker host/user/pass
   - InfluxDB URL/token/org/bucket
3. Install dependencies:
   - `python3 -m pip install -r services/requirements.txt`
4. Run bridge:
   - `python3 services/bridge_listener.py`

### 3) Publish sample telemetry

Use:

- `python3 scripts/publish_sample_telemetry.py`

This sends structured payloads to `Lonhro/Fleet/Update`.

### 4) Local no-docker harness (cloud VM safe)

If Docker/Mosquitto/InfluxDB are unavailable in your environment, validate parser + ingest transform logic with:

- `python3 scripts/mock_bridge_e2e_test.py`

This verifies:
- payload validation
- line protocol generation
- fault extraction
- command-topic routing rules
