import { InfluxDB, flux } from "@influxdata/influxdb-client";
import type {
  BridgeStatus,
  FaultEvent,
  FleetHealth,
  TelemetryApiResponse,
  FleetHealthResponse,
  TelemetryLatestResponse,
  TelemetryPoint,
} from "@/types/telemetry";

const fallbackPoints: TelemetryPoint[] = [
  {
    deviceId: "niu-48v-001",
    speedKmh: 41.2,
    batteryV: 41.9,
    motorTempC: 66.8,
    vescTempC: 62.4,
    rpm: 4210,
    faultCode: "NONE",
    bridgeOnline: true,
    heartbeat: true,
    region: "NSW-West",
    timestamp: new Date(Date.now() - 25_000).toISOString(),
  },
  {
    deviceId: "segway-36v-003",
    speedKmh: 28.4,
    batteryV: 38.1,
    motorTempC: 59.3,
    vescTempC: 55.1,
    rpm: 3120,
    faultCode: "NONE",
    bridgeOnline: true,
    heartbeat: true,
    region: "NSW-West",
    timestamp: new Date(Date.now() - 18_000).toISOString(),
  },
  {
    deviceId: "niu-48v-002",
    speedKmh: 0,
    batteryV: 40.7,
    motorTempC: 71.6,
    vescTempC: 68.2,
    rpm: 0,
    faultCode: "FAULT_CODE_DRV8301",
    bridgeOnline: true,
    heartbeat: true,
    region: "NSW-West",
    timestamp: new Date(Date.now() - 8_000).toISOString(),
  },
];

const fallbackFaults: FaultEvent[] = [
  {
    deviceId: "niu-48v-002",
    faultCode: "FAULT_CODE_DRV8301",
    timestamp: new Date(Date.now() - 8_000).toISOString(),
  },
  {
    deviceId: "niu-48v-004",
    faultCode: "OVER_VOLTAGE",
    timestamp: new Date(Date.now() - 125_000).toISOString(),
  },
];

function getInfluxConfig() {
  return {
    url: process.env.INFLUXDB_URL ?? "",
    token: process.env.INFLUXDB_TOKEN ?? "",
    org: process.env.INFLUXDB_ORG ?? "",
    bucket: process.env.INFLUXDB_BUCKET ?? "",
  };
}

function hasInfluxConfig(): boolean {
  const cfg = getInfluxConfig();
  return Boolean(cfg.url && cfg.token && cfg.org && cfg.bucket);
}

function mapFaults(points: TelemetryPoint[]): FaultEvent[] {
  return points
    .filter((point) => point.faultCode && point.faultCode !== "NONE")
    .map((point) => ({
      deviceId: point.deviceId,
      faultCode: point.faultCode,
      timestamp: point.timestamp,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 20);
}

function mapFleetHealth(points: TelemetryPoint[]): FleetHealth[] {
  return points
    .filter((point) => point.batteryV > 0)
    .map((point) => {
      const packNominal = point.deviceId.includes("48v") ? 48 : 36;
      const imbalanceScore = Math.max(0, Number(((packNominal - point.batteryV) / packNominal).toFixed(4)));
      return {
        deviceId: point.deviceId,
        batteryV: point.batteryV,
        imbalanceScore,
        flagged: imbalanceScore > 0.18 || point.faultCode !== "NONE",
      };
    })
    .sort((a, b) => Number(b.flagged) - Number(a.flagged));
}

function mapBridgeStatus(points: TelemetryPoint[]): BridgeStatus {
  const last = points
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  if (!last) {
    return {
      state: "warning",
      lastHeartbeat: null,
      source: "fallback",
    };
  }

  return {
    state: last.bridgeOnline && last.heartbeat ? "healthy" : "warning",
    lastHeartbeat: last.timestamp,
    source: "influx",
  };
}

async function queryInfluxPoints(limit = 200): Promise<TelemetryPoint[]> {
  const cfg = getInfluxConfig();
  const client = new InfluxDB({ url: cfg.url, token: cfg.token });
  const queryApi = client.getQueryApi(cfg.org);

  const telemetryQuery = flux`from(bucket: ${cfg.bucket})
    |> range(start: -6h)
    |> filter(fn: (r) => r._measurement == "vesc_telemetry")
    |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
    |> keep(columns: ["_time","device_id","fault_code","region","speed_kmh","battery_v","motor_temp_c","vesc_temp_c","rpm","bridge_online","heartbeat"])
    |> sort(columns: ["_time"], desc: true)
    |> limit(n: ${limit})`;

  const rows = await queryApi.collectRows<Record<string, unknown>>(telemetryQuery);

  return rows.map((row) => ({
    deviceId: String(row.device_id ?? "unknown-device"),
    speedKmh: Number(row.speed_kmh ?? 0),
    batteryV: Number(row.battery_v ?? 0),
    motorTempC: Number(row.motor_temp_c ?? 0),
    vescTempC: Number(row.vesc_temp_c ?? 0),
    rpm: Number(row.rpm ?? 0),
    faultCode: String(row.fault_code ?? "NONE"),
    bridgeOnline: Number(row.bridge_online ?? 1) === 1,
    heartbeat: Number(row.heartbeat ?? 1) === 1,
    region: String(row.region ?? "unknown"),
    timestamp: new Date(String(row._time ?? new Date().toISOString())).toISOString(),
  }));
}

export async function getTelemetrySnapshot(): Promise<TelemetryApiResponse> {
  const fallback = !hasInfluxConfig();
  if (fallback) {
    return {
      points: fallbackPoints,
      faults: fallbackFaults,
      fleetHealth: mapFleetHealth(fallbackPoints),
      bridge: mapBridgeStatus(fallbackPoints),
      source: "fallback",
      fetchedAt: new Date().toISOString(),
    };
  }

  try {
    const points = await queryInfluxPoints(250);
    const recent = points.slice(0, 80);
    const source = "influx";
    return {
      points: recent,
      faults: mapFaults(recent),
      fleetHealth: mapFleetHealth(recent),
      bridge: {
        ...mapBridgeStatus(recent),
        source,
      },
      source,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return {
      points: fallbackPoints,
      faults: fallbackFaults,
      fleetHealth: mapFleetHealth(fallbackPoints),
      bridge: mapBridgeStatus(fallbackPoints),
      source: "fallback",
      fetchedAt: new Date().toISOString(),
    };
  }
}

export async function getLatestTelemetrySnapshot(): Promise<TelemetryLatestResponse> {
  const snapshot = await getTelemetrySnapshot();
  const latest = snapshot.points[0] ?? null;
  const responseSource = snapshot.source === "influx" ? "influx" : "fallback";

  return {
    mode: responseSource === "influx" ? "live" : "fallback",
    data: latest
      ? {
          deviceId: latest.deviceId,
          timestamp: latest.timestamp,
          speedKmh: latest.speedKmh,
          batteryV: latest.batteryV,
          motorTempC: latest.motorTempC,
          vescTempC: latest.vescTempC,
          rpm: latest.rpm,
          faultCode: latest.faultCode,
          heartbeat: latest.heartbeat,
          bridgeOnline: latest.bridgeOnline,
          region: latest.region,
        }
      : {
          deviceId: "unknown-device",
          timestamp: new Date().toISOString(),
          speedKmh: 0,
          batteryV: 0,
          motorTempC: 0,
          vescTempC: 0,
          rpm: 0,
          faultCode: "NONE",
          heartbeat: false,
          bridgeOnline: false,
          region: "unknown",
        },
    source: responseSource,
    fetchedAt: snapshot.fetchedAt,
  };
}

export async function getFleetHealthSnapshot(): Promise<FleetHealthResponse> {
  const snapshot = await getTelemetrySnapshot();
  const flagged = snapshot.fleetHealth.filter((item) => item.flagged);
  const flaggedBatteries = flagged.map((item) => ({
    id: item.deviceId,
    cycles: Number(Math.round((1 - item.imbalanceScore) * 100)),
    sag: `${(item.imbalanceScore * 100).toFixed(1)}%`,
  }));

  return {
    mode: snapshot.source === "influx" ? "live" : "fallback",
    source: snapshot.source === "influx" ? "influx" : "fallback",
    generatedAt: snapshot.fetchedAt,
    flaggedBatteries,
  };
}
