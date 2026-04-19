export type TelemetrySnapshot = {
  deviceId: string;
  timestamp: string;
  speedKmh: number;
  batteryV: number;
  motorTempC: number;
  vescTempC: number;
  rpm: number;
  faultCode: string;
  heartbeat: boolean;
  bridgeOnline: boolean;
  region: string;
};

export type FaultEvent = {
  deviceId: string;
  faultCode: string;
  timestamp: string;
};

export type FleetHealth = {
  deviceId: string;
  batteryV: number;
  imbalanceScore: number;
  flagged: boolean;
};

export type BridgeStatus = {
  state: "healthy" | "warning";
  lastHeartbeat: string | null;
  source: "influx" | "fallback";
};

export type TelemetryPoint = TelemetrySnapshot;

export type TelemetryApiResponse = {
  points: TelemetryPoint[];
  faults: FaultEvent[];
  fleetHealth: FleetHealth[];
  bridge: BridgeStatus;
  source: "influx" | "fallback" | "error";
  fetchedAt: string;
  message?: string;
};

export type TelemetryLatestResponse = {
  mode: "live" | "fallback";
  data: TelemetrySnapshot;
  source: "influx" | "fallback";
  fetchedAt: string;
  message?: string;
};

export type FleetHealthResponse = {
  mode: "live" | "fallback";
  source: "influx" | "fallback";
  generatedAt: string;
  flaggedBatteries: Array<{
    id: string;
    cycles: number;
    sag: string;
  }>;
  message?: string;
};
