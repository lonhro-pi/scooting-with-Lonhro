from __future__ import annotations

import argparse
import asyncio
import json
import logging
from pathlib import Path
from typing import Any

from .config import load_config
from .controller import LonhroController, ProfileRunResult, StepResult
from .exceptions import LonhroError
from .transport import scan_nearby


def _default_config_path() -> Path:
    return Path("examples") / "scooter.example.toml"


def _configure_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    logging.getLogger("bleak.backends.bluezdbus").setLevel(logging.WARNING)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="lonhro-scooters",
        description=(
            "BLE UART client scaffold for Ninebot-style scooters. "
            "Provides encrypted auth, config-driven profiles, and a host-gated unlock flow."
        ),
    )
    parser.add_argument(
        "-c",
        "--config",
        default=str(_default_config_path()),
        help="Path to the scooter TOML config file.",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable debug logging.")

    subparsers = parser.add_subparsers(dest="command", required=True)

    scan_parser = subparsers.add_parser("scan", help="Scan for nearby BLE devices.")
    scan_parser.add_argument("--timeout", type=float, default=5.0, help="BLE scan timeout in seconds.")

    subparsers.add_parser("profiles", help="List configured profiles.")
    subparsers.add_parser("fingerprint", help="Print the current host fingerprint.")

    proof_parser = subparsers.add_parser("proof", help="Generate a local unlock proof from the configured shared secret.")
    proof_parser.add_argument("--challenge", help="Override the configured challenge string.")

    run_parser = subparsers.add_parser("run-profile", help="Connect and execute a configured profile.")
    run_parser.add_argument("profile", help="Profile name from the config file.")
    run_parser.add_argument("--signature", help="Explicit signature hex string for signature-gated profiles.")
    run_parser.add_argument("--fingerprint", help="Override the fingerprint associated with the provided signature.")
    run_parser.add_argument("--challenge", help="Override the configured challenge string.")
    run_parser.add_argument(
        "--no-auto-signature",
        action="store_true",
        help="Do not auto-sign on the local machine; require an explicit --signature.",
    )

    raw_parser = subparsers.add_parser("send-raw", help="Send a single raw packet using the active config's BLE settings.")
    raw_parser.add_argument("--target", required=True, help="Target device alias or numeric ID.")
    raw_parser.add_argument("--command", dest="command_byte", required=True, help="Command alias or numeric byte.")
    raw_parser.add_argument("--index", required=True, help="Register index / argument byte.")
    raw_parser.add_argument("--data-hex", default="", help="Optional payload hex.")
    raw_parser.add_argument("--source", help="Optional source device alias or numeric ID.")
    raw_parser.add_argument("--expect-reply", action="store_true", help="Wait for a matching reply packet.")

    read_parser = subparsers.add_parser("read-register", help="Read a register over the authenticated BLE link.")
    read_parser.add_argument("--target", required=True, help="Target device alias or numeric ID.")
    read_parser.add_argument("--index", required=True, help="Register index / argument byte.")
    read_parser.add_argument("--length", required=True, type=int, help="Number of bytes to read.")

    return parser


def _print_json(payload: Any) -> None:
    print(json.dumps(payload, indent=2, sort_keys=True))


def _format_step(step: StepResult) -> dict[str, Any]:
    return {
        "action": step.action,
        "request_hex": step.request_hex,
        "response_hex": step.response_hex,
        "note": step.note,
    }


def _format_profile_result(result: ProfileRunResult) -> dict[str, Any]:
    return {
        "profile_name": result.profile_name,
        "proof": None
        if result.proof is None
        else {
            "challenge": result.proof.challenge,
            "fingerprint": result.proof.fingerprint,
            "signature": result.proof.signature,
        },
        "steps": [_format_step(step) for step in result.steps],
    }


async def _run_async(args: argparse.Namespace) -> int:
    if args.command == "scan":
        devices = await scan_nearby(timeout=args.timeout)
        _print_json({"devices": devices})
        return 0

    config = load_config(args.config)
    controller = LonhroController(config)

    if args.command == "profiles":
        payload = {
            "profiles": [
                {
                    "name": profile.name,
                    "description": profile.description,
                    "requires_signature": profile.requires_signature,
                    "step_count": len(profile.steps),
                }
                for profile in controller.list_profiles()
            ]
        }
        _print_json(payload)
        return 0

    if args.command == "fingerprint":
        _print_json({"fingerprint": controller.authorizer.current_fingerprint()})
        return 0

    if args.command == "proof":
        proof = controller.build_unlock_proof(challenge=args.challenge)
        _print_json(
            {
                "challenge": proof.challenge,
                "fingerprint": proof.fingerprint,
                "signature": proof.signature,
            }
        )
        return 0

    if args.command == "run-profile":
        result = await controller.execute_profile(
            args.profile,
            signature=args.signature,
            fingerprint=args.fingerprint,
            challenge=args.challenge,
            allow_auto_signature=not args.no_auto_signature,
        )
        _print_json(_format_profile_result(result))
        return 0

    if args.command == "send-raw":
        result = await controller.send_raw_packet(
            target=args.target,
            command=args.command_byte,
            index=args.index,
            data_hex=args.data_hex,
            source=args.source,
            expect_reply=args.expect_reply,
        )
        _print_json(_format_step(result))
        return 0

    if args.command == "read-register":
        result = await controller.read_register(target=args.target, index=args.index, length=args.length)
        _print_json(_format_step(result))
        return 0

    raise RuntimeError(f"Unknown command: {args.command}")


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    _configure_logging(args.verbose)
    try:
        raise SystemExit(asyncio.run(_run_async(args)))
    except LonhroError as exc:
        raise SystemExit(f"lonhro-scooters: {exc}") from exc

