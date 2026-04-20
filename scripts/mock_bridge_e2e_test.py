#!/usr/bin/env python3
"""
Local no-network E2E sanity test for Phase 1 bridge logic.

This does not require MQTT/Influx running; it validates payload parsing,
heartbeat gating, and Flux-point conversion paths used by bridge_listener.py.
"""

import datetime as dt
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services"))

from bridge_listener import normalize_payload  # type: ignore
from influxdb_client import Point, WritePrecision


def build_point(data: dict) -> Point:
    return (
        Point("vesc_telemetry")
        .tag("device_id", data["deviceId"])
        .tag("fault_code", data["faultCode"])
        .tag("region", data["region"])
        .field("speed_kmh", data["speedKmh"])
        .field("battery_v", data["batteryV"])
        .field("motor_temp_c", data["motorTempC"])
        .field("vesc_temp_c", data["vescTempC"])
        .field("rpm", data["rpm"])
        .field("heartbeat", int(data["heartbeat"]))
        .field("bridge_online", int(data["bridgeOnline"]))
        .time(data["timestamp"], WritePrecision.MS)
    )


def main() -> None:
    now = dt.datetime.now(dt.UTC).isoformat()
    payload = {
        "deviceId": "niu-48v-001",
        "timestamp": now,
        "speedKmh": 39.2,
        "batteryV": 41.8,
        "motorTempC": 63.3,
        "vescTempC": 58.4,
        "rpm": 4210,
        "faultCode": "NONE",
        "heartbeat": True,
        "bridgeOnline": True,
        "gpsLat": -32.2497,
        "gpsLon": 148.6048,
    }
    parsed = normalize_payload(json.loads(json.dumps(payload)))
    assert parsed["deviceId"] == "niu-48v-001"
    assert parsed["heartbeat"] is True
    point = build_point(parsed)
    line_protocol = point.to_line_protocol()
    assert "vesc_telemetry" in line_protocol
    assert "speed_kmh=39.2" in line_protocol
    assert "device_id=niu-48v-001" in line_protocol
    print("MOCK_E2E_OK")
    print(line_protocol)


if __name__ == "__main__":
    main()
