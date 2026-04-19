from __future__ import annotations

import argparse
import json
import logging
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict

import paho.mqtt.client as mqtt
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class BridgeConfig:
    mqtt_host: str
    mqtt_port: int
    mqtt_username: str
    mqtt_password: str
    mqtt_topic_update: str
    mqtt_topic_heartbeat: str
    influx_url: str
    influx_token: str
    influx_org: str
    influx_bucket: str
    node_id: str

    @staticmethod
    def from_env() -> "BridgeConfig":
        return BridgeConfig(
            mqtt_host=os.getenv("MQTT_HOST", "localhost"),
            mqtt_port=int(os.getenv("MQTT_PORT", "1883")),
            mqtt_username=os.getenv("MQTT_USERNAME", "lonhro"),
            mqtt_password=os.getenv("MQTT_PASSWORD", "changeme"),
            mqtt_topic_update=os.getenv("MQTT_TOPIC_UPDATE", "Lonhro/Fleet/Update"),
            mqtt_topic_heartbeat=os.getenv("MQTT_TOPIC_HEARTBEAT", "Lonhro/Fleet/Heartbeat"),
            influx_url=os.getenv("INFLUXDB_URL", "http://localhost:8086"),
            influx_token=os.getenv("INFLUXDB_TOKEN", "lonhro-insecure-token"),
            influx_org=os.getenv("INFLUXDB_ORG", "lonhro"),
            influx_bucket=os.getenv("INFLUXDB_BUCKET", "fleet_telemetry"),
            node_id=os.getenv("LONHRO_NODE_ID", "bridge-pi"),
        )


def parse_timestamp(value: Any) -> int:
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            if value.endswith("Z"):
                value = value[:-1] + "+00:00"
            dt = datetime.fromisoformat(value)
            return int(dt.timestamp() * 1_000)
        except ValueError:
            pass
    return int(time.time() * 1_000)


def normalize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "deviceId": str(payload.get("deviceId", "unknown-device")),
        "timestamp": parse_timestamp(payload.get("timestamp")),
        "speedKmh": float(payload.get("speedKmh", 0.0)),
        "batteryV": float(payload.get("batteryV", 0.0)),
        "motorTempC": float(payload.get("motorTempC", 0.0)),
        "vescTempC": float(payload.get("vescTempC", 0.0)),
        "rpm": float(payload.get("rpm", 0.0)),
        "faultCode": str(payload.get("faultCode", "NONE")),
        "heartbeat": bool(payload.get("heartbeat", True)),
        "bridgeOnline": bool(payload.get("bridgeOnline", True)),
        "region": str(payload.get("region", "unknown")),
    }


class LonhroBridge:
    def __init__(self, config: BridgeConfig) -> None:
        self.config = config
        self.influx_client = InfluxDBClient(
            url=config.influx_url,
            token=config.influx_token,
            org=config.influx_org,
        )
        self.write_api = self.influx_client.write_api(write_options=SYNCHRONOUS)
        self.mqtt = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"lonhro-bridge-{config.node_id}")
        self.mqtt.username_pw_set(config.mqtt_username, config.mqtt_password)
        self.mqtt.on_connect = self.on_connect
        self.mqtt.on_message = self.on_message
        self.mqtt.on_disconnect = self.on_disconnect

    def on_connect(
        self,
        client: mqtt.Client,
        _userdata: Any,
        _flags: Dict[str, int],
        reason_code: mqtt.ReasonCode,
        _properties: mqtt.Properties | None,
    ) -> None:
        if reason_code.is_failure:
            logging.error("MQTT connect failed: %s", reason_code)
            return
        logging.info("Connected to MQTT %s:%s", self.config.mqtt_host, self.config.mqtt_port)
        client.subscribe(self.config.mqtt_topic_update, qos=1)
        logging.info("Subscribed topic: %s", self.config.mqtt_topic_update)

    def on_disconnect(
        self,
        _client: mqtt.Client,
        _userdata: Any,
        _disconnect_flags: mqtt.DisconnectFlags,
        reason_code: mqtt.ReasonCode,
        _properties: mqtt.Properties | None,
    ) -> None:
        if reason_code.is_failure:
            logging.warning("Disconnected from MQTT with error: %s", reason_code)
        else:
            logging.info("Disconnected from MQTT cleanly.")

    def publish_heartbeat(self, state: str, device_id: str) -> None:
        heartbeat_payload = {
            "nodeId": self.config.node_id,
            "deviceId": device_id,
            "state": state,
            "timestamp": utc_now_iso(),
        }
        self.mqtt.publish(self.config.mqtt_topic_heartbeat, json.dumps(heartbeat_payload), qos=1, retain=False)

    def write_to_influx(self, data: Dict[str, Any]) -> None:
        point = (
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
        self.write_api.write(bucket=self.config.influx_bucket, org=self.config.influx_org, record=point)

    def on_message(
        self,
        _client: mqtt.Client,
        _userdata: Any,
        msg: mqtt.MQTTMessage,
    ) -> None:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            normalized = normalize_payload(payload)
            self.write_to_influx(normalized)

            state = "healthy" if normalized["heartbeat"] and normalized["bridgeOnline"] else "warning"
            self.publish_heartbeat(state, normalized["deviceId"])

            logging.info(
                "Processed %s speed=%.1f battery=%.1f fault=%s state=%s",
                normalized["deviceId"],
                normalized["speedKmh"],
                normalized["batteryV"],
                normalized["faultCode"],
                state,
            )
        except Exception as exc:  # noqa: BLE001
            logging.exception("Message processing failed: %s", exc)

    def run(self) -> None:
        self.mqtt.connect(self.config.mqtt_host, self.config.mqtt_port, keepalive=30)
        self.mqtt.loop_forever(retry_first_connection=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lonhro MQTT -> Influx bridge listener.")
    parser.add_argument(
        "--log-level",
        default=os.getenv("LOG_LEVEL", "INFO"),
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Runtime log level.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    logging.basicConfig(level=getattr(logging, args.log_level), format="%(asctime)s %(levelname)s %(message)s")
    config = BridgeConfig.from_env()
    bridge = LonhroBridge(config)
    bridge.run()


if __name__ == "__main__":
    main()
