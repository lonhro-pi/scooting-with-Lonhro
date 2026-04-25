from __future__ import annotations

from dataclasses import dataclass
from enum import IntEnum
from typing import Iterable


class Command(IntEnum):
    READ = 0x01
    WRITE = 0x02
    WRITE_NO_REPLY = 0x03
    READ_ACK = 0x04
    WRITE_ACK = 0x05
    INIT = 0x5B
    PING = 0x5C
    PAIR = 0x5D


class DeviceId(IntEnum):
    DISPLAY = 0x01
    MCU = 0x02
    BLE_GEN = 0x04
    VCU = 0x09
    HEP = 0x11
    ESC_CONTROL = 0x20
    BLE = 0x21
    BMS = 0x22
    EXT_BMS = 0x23
    APP_PC = 0x3D
    APP_PHONE = 0x3E
    GENERIC_APP = 0x3F


class OperationMode(IntEnum):
    NORMAL = 0
    ECO = 1
    SPORT = 2


@dataclass(slots=True)
class Packet:
    source: int
    target: int
    command: int
    data_index: int
    data: bytes = b""

    MAGIC = bytes((0x5A, 0xA5))

    def encode(self) -> bytes:
        payload = bytes(
            (
                len(self.data),
                self.source & 0xFF,
                self.target & 0xFF,
                self.command & 0xFF,
                self.data_index & 0xFF,
            )
        ) + self.data
        return self.MAGIC + payload

    @classmethod
    def decode(cls, raw: bytes) -> Packet | None:
        if len(raw) < 7 or raw[:2] != cls.MAGIC:
            return None
        data_len = raw[2]
        total_len = data_len + 7
        if len(raw) != total_len:
            return None
        return cls(
            source=raw[3],
            target=raw[4],
            command=raw[5],
            data_index=raw[6],
            data=raw[7:],
        )

    @property
    def total_len(self) -> int:
        return len(self.data) + 7


def chunk_bytes(data: bytes, *, size: int) -> Iterable[bytes]:
    for start in range(0, len(data), size):
        yield data[start : start + size]


def kmh_to_le_speed(value_kmh: float) -> bytes:
    raw = max(0, round(value_kmh * 10))
    return raw.to_bytes(2, byteorder="little", signed=False)


def bool_word(enabled: bool) -> bytes:
    return (1 if enabled else 0).to_bytes(2, byteorder="little", signed=False)


def uint16_le(value: int) -> bytes:
    return int(value).to_bytes(2, byteorder="little", signed=False)


def int16_le(value: int) -> bytes:
    return int(value).to_bytes(2, byteorder="little", signed=True)


def parse_hex_bytes(value: str) -> bytes:
    compact = value.replace(" ", "").replace("_", "")
    if compact.startswith("0x"):
        compact = compact[2:]
    return bytes.fromhex(compact)


def parse_intish(value: int | str) -> int:
    if isinstance(value, int):
        return value
    return int(value, 0)


DEVICE_ALIASES: dict[str, int] = {
    "display": DeviceId.DISPLAY,
    "mcu": DeviceId.MCU,
    "ble_gen": DeviceId.BLE_GEN,
    "vcu": DeviceId.VCU,
    "hep": DeviceId.HEP,
    "esc": DeviceId.ESC_CONTROL,
    "esc_control": DeviceId.ESC_CONTROL,
    "ble": DeviceId.BLE,
    "bms": DeviceId.BMS,
    "ext_bms": DeviceId.EXT_BMS,
    "app_pc": DeviceId.APP_PC,
    "app_phone": DeviceId.APP_PHONE,
    "generic_app": DeviceId.GENERIC_APP,
}


COMMAND_ALIASES: dict[str, int] = {
    "read": Command.READ,
    "write": Command.WRITE,
    "write_no_reply": Command.WRITE_NO_REPLY,
    "read_ack": Command.READ_ACK,
    "write_ack": Command.WRITE_ACK,
    "init": Command.INIT,
    "ping": Command.PING,
    "pair": Command.PAIR,
}


def parse_device_id(value: int | str) -> int:
    if isinstance(value, int):
        return value & 0xFF
    normalized = value.strip().lower()
    if normalized in DEVICE_ALIASES:
        return int(DEVICE_ALIASES[normalized])
    return parse_intish(normalized) & 0xFF


def parse_command(value: int | str) -> int:
    if isinstance(value, int):
        return value & 0xFF
    normalized = value.strip().lower()
    if normalized in COMMAND_ALIASES:
        return int(COMMAND_ALIASES[normalized])
    return parse_intish(normalized) & 0xFF

