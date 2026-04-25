#!/usr/bin/env python3
"""Publish a sample telemetry message to MQTT."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

import paho.mqtt.client as mqtt


def main() -> int:
  host = os.getenv("MQTT_HOST", "127.0.0.1")
  port = int(os.getenv("MQTT_PORT", "1883"))
  username = os.getenv("MQTT_USERNAME", "lonhro")
  password = os.getenv("MQTT_PASSWORD", "lonhro-change-me")
  topic = os.getenv("MQTT_TOPIC_TELEMETRY", "Lonhro/Fleet/Update")

  payload = {
    "deviceId": "NIU-ATV-001",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "speedKmh": 41.2,
    "batteryV": 40.7,
    "motorTempC": 72.1,
    "vescTempC": 66.8,
    "rpm": 1720,
    "faultCode": "NONE",
    "heartbeat": True,
  }

  client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
  client.username_pw_set(username, password)
  client.connect(host, port, 30)
  result = client.publish(topic, json.dumps(payload), qos=1)
  result.wait_for_publish()
  print(f"Published telemetry to {topic}: {payload}")
  client.disconnect()
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
