from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
import tomllib

from .exceptions import ConfigError


@dataclass(slots=True, frozen=True)
class BluetoothConfig:
    address: str
    name: str | None = None
    write_uuid: str = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
    notify_uuid: str = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
    source: str = "app_pc"
    connect_timeout: float = 15.0
    response_timeout: float = 5.0
    chunk_size: int = 20


@dataclass(slots=True, frozen=True)
class SecurityConfig:
    shared_secret: str | None = None
    challenge: str = "lonhro-unlock-v1"
    allowed_fingerprints: tuple[str, ...] = ()


@dataclass(slots=True, frozen=True)
class ProfileStep:
    action: str
    args: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True, frozen=True)
class Profile:
    name: str
    description: str = ""
    requires_signature: bool = False
    steps: tuple[ProfileStep, ...] = ()


@dataclass(slots=True, frozen=True)
class ScooterConfig:
    bluetooth: BluetoothConfig
    security: SecurityConfig
    profiles: dict[str, Profile]

    def get_profile(self, name: str) -> Profile:
        try:
            return self.profiles[name]
        except KeyError as exc:
            raise ConfigError(f"Unknown profile '{name}'.") from exc


def _expect_table(value: Any, *, where: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ConfigError(f"{where} must be a TOML table.")
    return value


def _expect_list(value: Any, *, where: str) -> list[Any]:
    if not isinstance(value, list):
        raise ConfigError(f"{where} must be a TOML array.")
    return value


def _expect_str(value: Any, *, where: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ConfigError(f"{where} must be a non-empty string.")
    return value.strip()


def _expect_bool(value: Any, *, where: str) -> bool:
    if not isinstance(value, bool):
        raise ConfigError(f"{where} must be true or false.")
    return value


def _as_float(value: Any, *, where: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ConfigError(f"{where} must be a number.")
    return float(value)


def _as_int(value: Any, *, where: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ConfigError(f"{where} must be an integer.")
    return value


def _parse_bluetooth(raw: dict[str, Any]) -> BluetoothConfig:
    address = _expect_str(raw.get("address"), where="[bluetooth].address")
    name_value = raw.get("name")
    name = None if name_value is None else _expect_str(name_value, where="[bluetooth].name")
    write_uuid = raw.get("write_uuid", BluetoothConfig.write_uuid)
    notify_uuid = raw.get("notify_uuid", BluetoothConfig.notify_uuid)
    source = raw.get("source", BluetoothConfig.source)
    connect_timeout = _as_float(raw.get("connect_timeout", BluetoothConfig.connect_timeout), where="[bluetooth].connect_timeout")
    response_timeout = _as_float(
        raw.get("response_timeout", BluetoothConfig.response_timeout),
        where="[bluetooth].response_timeout",
    )
    chunk_size = _as_int(raw.get("chunk_size", BluetoothConfig.chunk_size), where="[bluetooth].chunk_size")
    if chunk_size <= 0:
        raise ConfigError("[bluetooth].chunk_size must be greater than zero.")
    return BluetoothConfig(
        address=address,
        name=name,
        write_uuid=_expect_str(write_uuid, where="[bluetooth].write_uuid"),
        notify_uuid=_expect_str(notify_uuid, where="[bluetooth].notify_uuid"),
        source=_expect_str(source, where="[bluetooth].source"),
        connect_timeout=connect_timeout,
        response_timeout=response_timeout,
        chunk_size=chunk_size,
    )


def _parse_security(raw: dict[str, Any]) -> SecurityConfig:
    shared_secret = raw.get("shared_secret")
    if shared_secret is not None:
        shared_secret = _expect_str(shared_secret, where="[security].shared_secret")
    challenge = raw.get("challenge", SecurityConfig.challenge)
    allowed_fingerprints_raw = _expect_list(raw.get("allowed_fingerprints", []), where="[security].allowed_fingerprints")
    allowed_fingerprints = tuple(
        _expect_str(item, where="[security].allowed_fingerprints[]").lower() for item in allowed_fingerprints_raw
    )
    return SecurityConfig(
        shared_secret=shared_secret,
        challenge=_expect_str(challenge, where="[security].challenge"),
        allowed_fingerprints=allowed_fingerprints,
    )


def _parse_profile(name: str, raw: dict[str, Any]) -> Profile:
    description = raw.get("description", "")
    if description:
        description = _expect_str(description, where=f"[profiles.{name}].description")
    requires_signature = raw.get("requires_signature", False)
    if not isinstance(requires_signature, bool):
        raise ConfigError(f"[profiles.{name}].requires_signature must be true or false.")
    steps_raw = _expect_list(raw.get("steps", []), where=f"[profiles.{name}].steps")
    if not steps_raw:
        raise ConfigError(f"[profiles.{name}] must define at least one step.")

    steps: list[ProfileStep] = []
    for idx, step_raw in enumerate(steps_raw, start=1):
        step = _expect_table(step_raw, where=f"[profiles.{name}].steps[{idx}]")
        action = _expect_str(step.get("action"), where=f"[profiles.{name}].steps[{idx}].action").lower()
        args = {key: value for key, value in step.items() if key != "action"}
        steps.append(ProfileStep(action=action, args=args))

    return Profile(name=name, description=description, requires_signature=requires_signature, steps=tuple(steps))


def load_config(path: str | Path) -> ScooterConfig:
    config_path = Path(path)
    try:
        with config_path.open("rb") as handle:
            raw = tomllib.load(handle)
    except FileNotFoundError as exc:
        raise ConfigError(f"Config file not found: {config_path}") from exc
    except tomllib.TOMLDecodeError as exc:
        raise ConfigError(f"Invalid TOML in {config_path}: {exc}") from exc

    bluetooth_raw = _expect_table(raw.get("bluetooth"), where="[bluetooth]")
    security_raw = _expect_table(raw.get("security", {}), where="[security]")
    profiles_raw = _expect_table(raw.get("profiles"), where="[profiles]")

    profiles = {
        profile_name: _parse_profile(profile_name, _expect_table(profile_table, where=f"[profiles.{profile_name}]"))
        for profile_name, profile_table in profiles_raw.items()
    }
    if not profiles:
        raise ConfigError("The config must define at least one profile.")

    return ScooterConfig(
        bluetooth=_parse_bluetooth(bluetooth_raw),
        security=_parse_security(security_raw),
        profiles=profiles,
    )
