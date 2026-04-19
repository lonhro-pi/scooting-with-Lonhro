# Lonhro Scooters

Config-driven Python BLE app scaffold for Ninebot-style scooters that:

- authenticates over the encrypted BLE UART flow used by newer firmware,
- executes configurable register/packet profiles,
- supports a host-gated "digital immobilizer" unlock flow,
- keeps risky model-specific tuning packets in config instead of hardcoding them.

This repository starts from the same general BLE/auth approach used by the public `ninebot-ble` client and wraps it in a cleaner CLI + profile system for custom scooter control workflows.

## What the app does

- Scan for nearby BLE devices
- Connect to a scooter using `bleak`
- Perform the encrypted Ninebot auth handshake with `miauth`
- Persist the BLE app key for reconnects
- Execute profiles defined in TOML
- Gate selected profiles behind a host fingerprint + HMAC signature

## Important note on tuning actions

Scooter commands for region changes, SHFW-related settings, field weakening, and other tuning features vary by model, firmware, and board layout. The app therefore treats those as **configurable packet steps** rather than pretending there is one universal packet for every scooter.

Built-in helpers are included for common patterns like:

- setting a lock flag,
- setting a speed limit register,
- changing mode,
- sending a signature/unlock payload,
- reading registers,
- sending raw packets.

You can extend profiles with explicit packet steps once you confirm the exact bytes for your scooter.

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .[dev]
```

## Quick start

### 1. Copy and edit the config

```bash
cp examples/scooter.example.toml scooter.toml
```

Edit:

- `bluetooth.address`
- optionally `bluetooth.name`
- `security.shared_secret`
- `security.allowed_fingerprints`
- any model-specific packet indices/targets you need

### 2. Discover devices

```bash
lonhro-scooters scan
```

### 3. Get the local host fingerprint

```bash
lonhro-scooters -c scooter.toml fingerprint
```

Put that fingerprint into `security.allowed_fingerprints` if you want to restrict unlock-capable profiles to your approved machine.

### 4. Generate a proof for the current machine

```bash
lonhro-scooters -c scooter.toml proof
```

### 5. List profiles

```bash
lonhro-scooters -c scooter.toml profiles
```

### 6. Run a startup immobilizer profile

```bash
lonhro-scooters -c scooter.toml run-profile startup_lock
```

### 7. Run the signature-gated unlock profile

```bash
lonhro-scooters -c scooter.toml run-profile lonhro_unlock_42
```

If the profile requires a signature and `security.shared_secret` is configured, the CLI can auto-sign for the current approved host. You can also provide a signature manually:

```bash
lonhro-scooters -c scooter.toml run-profile lonhro_unlock_42 \
  --fingerprint <approved-fingerprint> \
  --signature <hex-signature> \
  --no-auto-signature
```

## CLI

```bash
lonhro-scooters --help
```

Commands:

- `scan`
- `profiles`
- `fingerprint`
- `proof`
- `run-profile <name>`
- `send-raw`
- `read-register`

## Config format

The app uses TOML.

### Bluetooth section

```toml
[bluetooth]
address = "AA:BB:CC:DD:EE:FF"
name = "SCOOTER_NAME"
write_uuid = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
notify_uuid = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
source = "app_pc"
```

### Security section

```toml
[security]
shared_secret = "replace-me"
challenge = "lonhro-unlock-v1"
allowed_fingerprints = ["<fingerprint>"]
```

### Profile steps

Each profile is an ordered set of steps:

- `sleep`
- `read_register`
- `set_speed_limit`
- `set_mode`
- `set_lock_flag`
- `send_signature`
- `send_packet`
- `write_register`

Example raw packet step:

```toml
[[profiles.custom.steps]]
action = "send_packet"
target = "display"
command = "write_no_reply"
index = 0x70
data_hex = "01"
```

## Digital immobilizer flow

The included example config models your requested flow like this:

1. `startup_lock` writes a lock flag during startup
2. `lonhro_unlock_42` is marked `requires_signature = true`
3. That profile first sends a signature payload
4. Then it disables the lock flag
5. Then it switches to sport mode
6. Then it applies a higher speed-limit register value

The example signature payload is **host-side gating plus an app-side unlock marker**. It gives you a clean place to enforce "this machine is allowed to send the unlock profile" before the scooter-control steps are executed.

If your scooter firmware expects a different unlock packet shape, adjust the `send_signature` step in config.

## Development

Run tests:

```bash
pytest
```

## Project status

This is a strong scaffold for a custom Linux scooter app:

- BLE auth/session handling is implemented
- packet/profile engine is implemented
- signature gating is implemented
- example profiles are included

The remaining scooter-specific work is confirming the exact tuning/register packets for your hardware and firmware revision.
