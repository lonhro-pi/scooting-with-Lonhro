from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from typing import Any

from .config import Profile, ProfileStep, ScooterConfig
from .exceptions import CommandExecutionError, ConfigError, SecurityError
from .protocol import (
    Command,
    DEVICE_ALIASES,
    COMMAND_ALIASES,
    OperationMode,
    Packet,
    bool_word,
    int16_le,
    kmh_to_le_speed,
    parse_command,
    parse_device_id,
    parse_hex_bytes,
    parse_intish,
    uint16_le,
)
from .security import AuthorizerConfig, HostAuthorizer, UnlockProof
from .transport import NinebotBleSession, SessionStore

LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class StepResult:
    action: str
    request_hex: str | None = None
    response_hex: str | None = None
    note: str | None = None


@dataclass(slots=True)
class ProfileRunResult:
    profile_name: str
    proof: UnlockProof | None
    steps: list[StepResult]


class LonhroController:
    def __init__(self, config: ScooterConfig, *, session_store: SessionStore | None = None) -> None:
        self.config = config
        self.session_store = session_store or SessionStore()
        self.authorizer = HostAuthorizer(
            AuthorizerConfig(
                shared_secret=config.security.shared_secret,
                challenge=config.security.challenge,
                allowed_fingerprints=config.security.allowed_fingerprints,
            )
        )

    def list_profiles(self) -> list[Profile]:
        return [self.config.profiles[name] for name in sorted(self.config.profiles)]

    def build_unlock_proof(self, *, challenge: str | None = None) -> UnlockProof:
        return self.authorizer.build_local_proof(challenge=challenge)

    async def execute_profile(
        self,
        profile_name: str,
        *,
        signature: str | None = None,
        fingerprint: str | None = None,
        challenge: str | None = None,
        allow_auto_signature: bool = True,
    ) -> ProfileRunResult:
        profile = self.config.get_profile(profile_name)
        proof = self._resolve_profile_proof(
            profile,
            signature=signature,
            fingerprint=fingerprint,
            challenge=challenge,
            allow_auto_signature=allow_auto_signature,
        )

        async with NinebotBleSession(self.config.bluetooth, session_store=self.session_store) as session:
            results = []
            for step in profile.steps:
                results.append(await self._run_step(session, step, proof=proof))

        return ProfileRunResult(profile_name=profile.name, proof=proof, steps=results)

    async def send_raw_packet(
        self,
        *,
        target: int | str,
        command: int | str,
        index: int | str,
        data_hex: str = "",
        source: int | str | None = None,
        expect_reply: bool = False,
    ) -> StepResult:
        step_args: dict[str, Any] = {
            "target": target,
            "command": command,
            "index": index,
            "data_hex": data_hex,
            "expect_reply": expect_reply,
        }
        if source is not None:
            step_args["source"] = source
        step = ProfileStep(action="send_packet", args=step_args)
        async with NinebotBleSession(self.config.bluetooth, session_store=self.session_store) as session:
            return await self._run_step(session, step, proof=None)

    async def read_register(
        self,
        *,
        target: int | str,
        index: int | str,
        length: int,
    ) -> StepResult:
        step = ProfileStep(
            action="read_register",
            args={"target": target, "index": index, "length": length},
        )
        async with NinebotBleSession(self.config.bluetooth, session_store=self.session_store) as session:
            return await self._run_step(session, step, proof=None)

    def _resolve_profile_proof(
        self,
        profile: Profile,
        *,
        signature: str | None,
        fingerprint: str | None,
        challenge: str | None,
        allow_auto_signature: bool,
    ) -> UnlockProof | None:
        if not profile.requires_signature:
            return None
        return self.authorizer.verify(
            signature=signature,
            fingerprint=fingerprint,
            challenge=challenge,
            allow_auto_signature=allow_auto_signature,
        )

    async def _run_step(
        self,
        session: NinebotBleSession,
        step: ProfileStep,
        *,
        proof: UnlockProof | None,
    ) -> StepResult:
        try:
            if step.action == "sleep":
                seconds = self._float_arg(step.args, "seconds")
                await asyncio.sleep(seconds)
                return StepResult(action=step.action, note=f"slept for {seconds:.3f}s")

            if step.action == "read_register":
                target = parse_device_id(step.args.get("target", "esc_control"))
                index = parse_intish(step.args["index"]) & 0xFF
                length = parse_intish(step.args["length"])
                response = await session.read_register(target=target, index=index, length=length)
                packet = Packet(
                    source=parse_device_id(self.config.bluetooth.source),
                    target=target,
                    command=int(Command.READ),
                    data_index=index,
                    data=bytes((length & 0xFF,)),
                )
                return StepResult(
                    action=step.action,
                    request_hex=packet.encode().hex(),
                    response_hex=response.hex(),
                    note=f"read {length} byte(s) from 0x{index:02X}",
                )

            if step.action == "set_speed_limit":
                packet = self._packet_from_speed_limit(step)
                reply = await session.execute_packet(packet, expect_reply=self._bool_arg(step.args, "expect_reply", default=False))
                return StepResult(
                    action=step.action,
                    request_hex=packet.encode().hex(),
                    response_hex=None if reply is None else reply.encode().hex(),
                    note=f"speed limit set to {self._float_arg(step.args, 'kmh'):.1f} km/h",
                )

            if step.action == "set_mode":
                packet = self._packet_from_mode(step)
                reply = await session.execute_packet(packet, expect_reply=self._bool_arg(step.args, "expect_reply", default=False))
                return StepResult(
                    action=step.action,
                    request_hex=packet.encode().hex(),
                    response_hex=None if reply is None else reply.encode().hex(),
                    note=f"mode -> {self._mode_from_step(step).name.lower()}",
                )

            if step.action == "set_lock_flag":
                packet = self._packet_from_lock_flag(step)
                reply = await session.execute_packet(packet, expect_reply=self._bool_arg(step.args, "expect_reply", default=False))
                locked = self._bool_arg(step.args, "locked", default=True)
                return StepResult(
                    action=step.action,
                    request_hex=packet.encode().hex(),
                    response_hex=None if reply is None else reply.encode().hex(),
                    note="lock enabled" if locked else "lock disabled",
                )

            if step.action == "send_signature":
                if proof is None:
                    raise SecurityError("The send_signature action requires a signature-gated profile.")
                packet = self._packet_from_signature(step, proof)
                reply = await session.execute_packet(packet, expect_reply=self._bool_arg(step.args, "expect_reply", default=False))
                return StepResult(
                    action=step.action,
                    request_hex=packet.encode().hex(),
                    response_hex=None if reply is None else reply.encode().hex(),
                    note=f"sent signature proof for fingerprint {proof.fingerprint}",
                )

            if step.action in {"send_packet", "write_register"}:
                packet = self._packet_from_generic_step(step)
                reply = await session.execute_packet(packet, expect_reply=self._bool_arg(step.args, "expect_reply", default=False))
                return StepResult(
                    action=step.action,
                    request_hex=packet.encode().hex(),
                    response_hex=None if reply is None else reply.encode().hex(),
                    note=f"sent cmd=0x{packet.command:02X} idx=0x{packet.data_index:02X}",
                )

        except KeyError as exc:
            raise CommandExecutionError(f"Missing required step argument '{exc.args[0]}' in action '{step.action}'.") from exc
        except (ValueError, TypeError) as exc:
            raise CommandExecutionError(f"Invalid step arguments for action '{step.action}': {exc}") from exc

        raise CommandExecutionError(f"Unsupported action '{step.action}'.")

    def _packet_from_speed_limit(self, step: ProfileStep) -> Packet:
        kmh = self._float_arg(step.args, "kmh")
        return Packet(
            source=parse_device_id(step.args.get("source", self.config.bluetooth.source)),
            target=parse_device_id(step.args.get("target", "esc_control")),
            command=parse_command(step.args.get("command", "write_no_reply")),
            data_index=parse_intish(step.args.get("index", 0x72)) & 0xFF,
            data=kmh_to_le_speed(kmh),
        )

    def _mode_from_step(self, step: ProfileStep) -> OperationMode:
        raw_mode = step.args.get("mode", "sport")
        if isinstance(raw_mode, str):
            normalized = raw_mode.strip().lower()
            alias_map = {
                "normal": OperationMode.NORMAL,
                "eco": OperationMode.ECO,
                "sport": OperationMode.SPORT,
            }
            if normalized in alias_map:
                return alias_map[normalized]
        return OperationMode(parse_intish(raw_mode))

    def _packet_from_mode(self, step: ProfileStep) -> Packet:
        mode = self._mode_from_step(step)
        return Packet(
            source=parse_device_id(step.args.get("source", self.config.bluetooth.source)),
            target=parse_device_id(step.args.get("target", "esc_control")),
            command=parse_command(step.args.get("command", "write_no_reply")),
            data_index=parse_intish(step.args.get("index", 0x75)) & 0xFF,
            data=uint16_le(int(mode)),
        )

    def _packet_from_lock_flag(self, step: ProfileStep) -> Packet:
        locked = self._bool_arg(step.args, "locked", default=True)
        byte_width = parse_intish(step.args.get("byte_width", 1))
        if byte_width not in (1, 2):
            raise ConfigError("set_lock_flag.byte_width must be 1 or 2.")
        if byte_width == 1:
            payload = bytes((1 if locked else 0,))
        else:
            payload = bool_word(locked)
        return Packet(
            source=parse_device_id(step.args.get("source", self.config.bluetooth.source)),
            target=parse_device_id(step.args.get("target", "display")),
            command=parse_command(step.args.get("command", "write_no_reply")),
            data_index=parse_intish(step.args.get("index", 0x70)) & 0xFF,
            data=payload,
        )

    def _packet_from_signature(self, step: ProfileStep, proof: UnlockProof) -> Packet:
        payload_format = str(step.args.get("format", "ascii")).strip().lower()
        if payload_format == "ascii":
            payload = f"{proof.challenge}:{proof.fingerprint}:{proof.signature}".encode("utf-8")
        elif payload_format == "json":
            payload = json.dumps(
                {
                    "challenge": proof.challenge,
                    "fingerprint": proof.fingerprint,
                    "signature": proof.signature,
                },
                separators=(",", ":"),
                sort_keys=True,
            ).encode("utf-8")
        elif payload_format == "hex":
            payload = parse_hex_bytes(step.args["data_hex"])
        else:
            raise ConfigError("send_signature.format must be one of: ascii, json, hex.")

        return Packet(
            source=parse_device_id(step.args.get("source", self.config.bluetooth.source)),
            target=parse_device_id(step.args.get("target", "display")),
            command=parse_command(step.args.get("command", "write_no_reply")),
            data_index=parse_intish(step.args.get("index", 0xF0)) & 0xFF,
            data=payload,
        )

    def _packet_from_generic_step(self, step: ProfileStep) -> Packet:
        payload = self._payload_from_args(step.args)
        return Packet(
            source=parse_device_id(step.args.get("source", self.config.bluetooth.source)),
            target=parse_device_id(step.args["target"]),
            command=parse_command(step.args.get("command", "write_no_reply")),
            data_index=parse_intish(step.args["index"]) & 0xFF,
            data=payload,
        )

    def _payload_from_args(self, args: dict[str, Any]) -> bytes:
        if "data_hex" in args:
            return parse_hex_bytes(str(args["data_hex"]))
        if "data_ascii" in args:
            return str(args["data_ascii"]).encode("utf-8")
        if "data_uint16" in args:
            return uint16_le(parse_intish(args["data_uint16"]))
        if "data_int16" in args:
            return int16_le(parse_intish(args["data_int16"]))
        if "data_bool" in args:
            return bool_word(self._coerce_bool(args["data_bool"]))
        if "data_u8" in args:
            return bytes((parse_intish(args["data_u8"]) & 0xFF,))
        return b""

    def _float_arg(self, args: dict[str, Any], key: str) -> float:
        value = args[key]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{key} must be a number")
        return float(value)

    def _bool_arg(self, args: dict[str, Any], key: str, *, default: bool) -> bool:
        if key not in args:
            return default
        return self._coerce_bool(args[key])

    def _coerce_bool(self, value: Any) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on"}:
                return True
            if normalized in {"0", "false", "no", "off"}:
                return False
        raise ValueError(f"Expected a boolean value, got {value!r}")
