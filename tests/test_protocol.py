from lonhro_scooters.protocol import Packet, chunk_bytes, kmh_to_le_speed, parse_command, parse_device_id


def test_packet_round_trip() -> None:
    packet = Packet(source=0x3D, target=0x21, command=0x03, data_index=0x70, data=b"\x01")
    encoded = packet.encode()
    decoded = Packet.decode(encoded)
    assert decoded == packet


def test_chunk_bytes_splits_into_mtu_chunks() -> None:
    chunks = list(chunk_bytes(b"abcdefghijklmnopqrstuvwxyz", size=10))
    assert chunks == [b"abcdefghij", b"klmnopqrst", b"uvwxyz"]


def test_kmh_to_le_speed() -> None:
    assert kmh_to_le_speed(42.0) == b"\xa4\x01"


def test_device_and_command_aliases() -> None:
    assert parse_device_id("display") == 0x01
    assert parse_device_id("0x21") == 0x21
    assert parse_command("write_no_reply") == 0x03
    assert parse_command("0x5c") == 0x5C
