from __future__ import annotations

import asyncio
import json
import logging
import secrets
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from bleak import BleakClient, BleakScanner
from bleak.backends.characteristic import BleakGATTCharacteristic
from miauth.nb.nbcrypto import NbCrypto

from .config import BluetoothConfig
from .exceptions import HandshakeError, ProtocolError
from .protocol import Command, DeviceId, Packet, chunk_bytes, parse_device_id

LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class SessionRecord:
    address: str
    name: str
    app_key_hex: str
    serial_hex: str | None = None
    updated_at: float = 0.0


class SessionStore:
    def __init__(self, path: str | Path | None = None) -> None:
        self.path = Path(path) if path else Path.home() / ".config" / "lonhro-scooters" / "session.json"

    def get(self, address: str) -> SessionRecord | None:
        raw = self._read_raw()
        entry = raw.get(address.upper())
        if not isinstance(entry, dict):
            return None
        return SessionRecord(
            address=address.upper(),
            name=str(entry.get("name", "")),
            app_key_hex=str(entry.get("app_key_hex", "")),
            serial_hex=str(entry["serial_hex"]) if entry.get("serial_hex") else None,
            updated_at=float(entry.get("updated_at", 0.0)),
        )

    def put(self, record: SessionRecord) -> None:
        raw = self._read_raw()
        raw[record.address.upper()] = asdict(record)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(raw, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    def _read_raw(self) -> dict[str, Any]:
        if not self.path.exists():
            return {}
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            LOGGER.warning("Ignoring unreadable session store: %s", self.path)
            return {}
        return data if isinstance(data, dict) else {}


async def scan_nearby(*, timeout: float = 5.0) -> list[dict[str, Any]]:
    devices = await BleakScanner.discover(timeout=timeout)
    records = []
    for device in devices:
        records.append(
            {
                "name": device.name,
                "address": device.address,
                "rssi": getattr(device, "rssi", None),
            }
        )
    return sorted(records, key=lambda item: ((item["name"] or "").lower(), item["address"]))


class NinebotBleSession:
    def __init__(self, config: BluetoothConfig, *, session_store: SessionStore | None = None) -> None:
        self.config = config
        self.session_store = session_store or SessionStore()
        self.crypto = NbCrypto()
        self.client: BleakClient | None = None
        self.receive_queue: asyncio.Queue[Packet] = asyncio.Queue(maxsize=100)
        self.receive_buffer = bytearray()
        self.ble_key = b""
        self.app_key = b""
        self.serial = b""
        self.device_name = config.name or ""
        self._source_id = parse_device_id(config.source)

    async def __aenter__(self) -> "NinebotBleSession":
        await self.connect()
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.disconnect()

    @property
    def is_connected(self) -> bool:
        return self.client is not None and self.client.is_connected

    async def connect(self) -> None:
        if self.is_connected:
            return

        self.device_name = await self._resolve_device_name()
        self.crypto.set_name(self.device_name.encode("utf-8"))
        self.receive_buffer = bytearray()

        self.client = BleakClient(self.config.address, timeout=self.config.connect_timeout)
        try:
            await self.client.connect()
            await self.client.start_notify(self.config.notify_uuid, self._notification_callback)
            await self._authenticate()
        except Exception:
            await self.disconnect()
            raise

    async def disconnect(self) -> None:
        if self.client is None:
            return
        try:
            if self.client.is_connected:
                await self.client.stop_notify(self.config.notify_uuid)
                await self.client.disconnect()
        finally:
            self.client = None
            self.receive_buffer = bytearray()
            while not self.receive_queue.empty():
                self.receive_queue.get_nowait()

    async def request(self, packet: Packet, *, timeout: float | None = None) -> Packet:
        timeout = timeout or self.config.response_timeout
        if packet.command == int(Command.READ):
            expected_command = int(Command.READ_ACK)
        elif packet.command == int(Command.WRITE):
            expected_command = int(Command.WRITE_ACK)
        else:
            expected_command = packet.command
        deadline = time.monotonic() + timeout
        attempts = 0
        while time.monotonic() < deadline:
            attempts += 1
            await self.send_packet(packet)
            try:
                while time.monotonic() < deadline:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        break
                    reply = await self.receive_packet(timeout=remaining)
                    if self._matches(packet, reply, expected_command):
                        return reply
            except TimeoutError:
                LOGGER.debug("Timed out on attempt %d for packet %s", attempts, packet)
            LOGGER.debug("Retrying request attempt %d for packet %s", attempts, packet)
        raise TimeoutError(f"Timed out waiting for response to {packet}")

    async def receive_packet(self, *, timeout: float | None = None) -> Packet:
        timeout = timeout or self.config.response_timeout
        try:
            return await asyncio.wait_for(self.receive_queue.get(), timeout=timeout)
        except asyncio.TimeoutError as exc:
            raise TimeoutError("Timed out waiting for scooter packet") from exc

    async def send_packet(self, packet: Packet) -> None:
        if not self.is_connected or self.client is None:
            raise HandshakeError("The BLE session is not connected.")
        message = bytes(self.crypto.encrypt(packet.encode()))
        for chunk in chunk_bytes(message, size=self.config.chunk_size):
            await self.client.write_gatt_char(self.config.write_uuid, chunk, response=False)
            if len(message) > self.config.chunk_size:
                await asyncio.sleep(0.01)

    async def read_register(self, *, target: int | str, index: int | str, length: int) -> bytes:
        packet = Packet(
            source=self._source_id,
            target=parse_device_id(target),
            command=int(Command.READ),
            data_index=int(index) & 0xFF,
            data=bytes((int(length) & 0xFF,)),
        )
        reply = await self.request(packet)
        return reply.data

    async def execute_packet(self, packet: Packet, *, expect_reply: bool = False) -> Packet | None:
        if expect_reply:
            return await self.request(packet)
        await self.send_packet(packet)
        return None

    async def _resolve_device_name(self) -> str:
        if self.config.name:
            return self.config.name
        devices = await scan_nearby(timeout=min(self.config.connect_timeout, 6.0))
        for device in devices:
            if str(device["address"]).lower() == self.config.address.lower():
                name = device.get("name")
                if name:
                    return str(name)
                break
        raise HandshakeError(
            "Could not resolve the scooter BLE name. Set [bluetooth].name in the config or use the scan command."
        )

    async def _authenticate(self) -> None:
        init_packet = Packet(
            source=self._source_id,
            target=int(DeviceId.BLE),
            command=int(Command.INIT),
            data_index=0,
            data=b"",
        )
        response = await self.request(init_packet, timeout=max(self.config.response_timeout, 8.0))
        if response.command != int(Command.INIT) or len(response.data) < 16:
            raise ProtocolError("Unexpected INIT response from scooter.")

        self.ble_key = response.data[:16]
        self.crypto.set_ble_data(self.ble_key)
        self.serial = response.data[16:]
        if not self.serial:
            raise ProtocolError("Scooter INIT response did not include a serial number.")

        stored = self.session_store.get(self.config.address)
        if stored and stored.app_key_hex:
            try:
                stored_key = bytes.fromhex(stored.app_key_hex)
            except ValueError:
                stored_key = b""
            if stored_key and await self._try_existing_key(stored_key):
                self.app_key = stored_key
                self._save_session()
                return
            LOGGER.info("Stored BLE session key was rejected; starting a fresh pairing flow.")
            self.crypto.set_ble_data(self.ble_key)

        self.app_key = secrets.token_bytes(16)
        await self._pair_new_key()
        self._save_session()

    async def _try_existing_key(self, app_key: bytes) -> bool:
        try:
            ping_response = await self.request(
                Packet(
                    source=self._source_id,
                    target=int(DeviceId.BLE),
                    command=int(Command.PING),
                    data_index=0,
                    data=app_key,
                ),
                timeout=max(self.config.response_timeout, 8.0),
            )
        except TimeoutError:
            return False

        if ping_response.data_index != 1:
            return False

        self.crypto.set_app_data(app_key)
        try:
            auth_response = await self.request(
                Packet(
                    source=self._source_id,
                    target=int(DeviceId.BLE),
                    command=int(Command.PAIR),
                    data_index=0,
                    data=self.serial,
                ),
                timeout=max(self.config.response_timeout, 8.0),
            )
        except TimeoutError:
            return False
        return auth_response.data_index == 1

    async def _pair_new_key(self) -> None:
        ping_response = await self.request(
            Packet(
                source=self._source_id,
                target=int(DeviceId.BLE),
                command=int(Command.PING),
                data_index=0,
                data=self.app_key,
            ),
            timeout=max(self.config.response_timeout, 8.0),
        )
        if ping_response.data_index != 1:
            deadline = time.monotonic() + 60.0
            LOGGER.info("Confirm pairing by briefly pressing the scooter power button.")
            while time.monotonic() < deadline:
                await self.send_packet(
                    Packet(
                        source=self._source_id,
                        target=int(DeviceId.BLE),
                        command=int(Command.PAIR),
                        data_index=0,
                        data=self.serial,
                    )
                )
                try:
                    response = await self.receive_packet(timeout=2.0)
                except TimeoutError:
                    continue
                if response.command in (int(Command.PING), int(Command.PAIR)) and response.data_index == 1:
                    break
            else:
                raise HandshakeError("Timed out waiting for scooter pairing confirmation.")

        self.crypto.set_app_data(self.app_key)
        auth_response = await self.request(
            Packet(
                source=self._source_id,
                target=int(DeviceId.BLE),
                command=int(Command.PAIR),
                data_index=0,
                data=self.serial,
            ),
            timeout=max(self.config.response_timeout, 8.0),
        )
        if auth_response.data_index != 1:
            raise HandshakeError("Scooter rejected the authentication step after pairing.")

    def _save_session(self) -> None:
        self.session_store.put(
            SessionRecord(
                address=self.config.address.upper(),
                name=self.device_name,
                app_key_hex=self.app_key.hex(),
                serial_hex=self.serial.hex() if self.serial else None,
                updated_at=time.time(),
            )
        )

    def _notification_callback(self, _: BleakGATTCharacteristic, data: bytearray) -> None:
        asyncio.create_task(self._handle_notification(bytes(data)))

    async def _handle_notification(self, data: bytes) -> None:
        if data[:2] == Packet.MAGIC:
            self.receive_buffer = bytearray(data)
        else:
            self.receive_buffer.extend(data)

        if len(self.receive_buffer) < 3:
            return

        decrypted = bytes(self.crypto.decrypt(bytes(self.receive_buffer)))
        expected_len = self.receive_buffer[2] + 7
        if len(decrypted) == expected_len:
            packet = Packet.decode(decrypted)
            if packet is None:
                LOGGER.warning("Received an undecodable packet: %s", decrypted.hex())
            else:
                await self.receive_queue.put(packet)
            self.receive_buffer = bytearray()
            return

        if len(decrypted) > expected_len:
            LOGGER.warning("Discarding malformed BLE packet with %d bytes", len(decrypted))
            self.receive_buffer = bytearray()

    def _matches(self, request: Packet, response: Packet, expected_command: int) -> bool:
        if response.source != request.target or response.target != request.source:
            return False
        if response.command != expected_command:
            return False
        if request.command <= int(Command.WRITE_ACK):
            return response.data_index == request.data_index
        return True
