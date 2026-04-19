from __future__ import annotations

from pathlib import Path

import pytest

from lonhro_scooters.config import load_config
from lonhro_scooters.controller import LonhroController
from lonhro_scooters.exceptions import ConfigError, SecurityError


def test_load_config_parses_profiles() -> None:
    config = load_config(Path("examples") / "scooter.example.toml")
    assert config.bluetooth.address == "00:00:00:00:00:00"
    assert "startup_lock" in config.profiles
    assert config.profiles["lonhro_unlock_42"].requires_signature is True


def test_load_config_rejects_profile_without_steps(tmp_path: Path) -> None:
    path = tmp_path / "bad.toml"
    path.write_text(
        """
[bluetooth]
address = "00:11:22:33:44:55"

[profiles.empty]
requires_signature = false
steps = []
""".strip()
        + "\n",
        encoding="utf-8",
    )
    with pytest.raises(ConfigError):
        load_config(path)


def test_controller_builds_lock_packet() -> None:
    config = load_config(Path("examples") / "scooter.example.toml")
    controller = LonhroController(config)
    step = config.profiles["startup_lock"].steps[0]
    packet = controller._packet_from_lock_flag(step)  # noqa: SLF001
    assert packet.data_index == 0x70
    assert packet.data == b"\x01"


def test_controller_requires_secret_for_unlock_proof(tmp_path: Path) -> None:
    path = tmp_path / "no-secret.toml"
    path.write_text(
        """
[bluetooth]
address = "00:11:22:33:44:55"

[security]
challenge = "demo"

[profiles.unlock]
requires_signature = true
steps = [{ action = "send_signature" }]
""".strip()
        + "\n",
        encoding="utf-8",
    )
    controller = LonhroController(load_config(path))
    with pytest.raises(SecurityError):
        controller.build_unlock_proof()
