from __future__ import annotations

import pytest

from lonhro_scooters.exceptions import SecurityError
from lonhro_scooters.security import AuthorizerConfig, HostAuthorizer, build_signature


def test_verify_accepts_matching_signature() -> None:
    authorizer = HostAuthorizer(
        AuthorizerConfig(
            shared_secret="top-secret",
            challenge="unlock-now",
            allowed_fingerprints=("abc123",),
        )
    )

    proof = authorizer.verify(
        signature=build_signature("top-secret", "unlock-now", "abc123"),
        fingerprint="abc123",
        allow_auto_signature=False,
    )

    assert proof.fingerprint == "abc123"
    assert proof.challenge == "unlock-now"


def test_verify_rejects_wrong_signature() -> None:
    authorizer = HostAuthorizer(
        AuthorizerConfig(
            shared_secret="top-secret",
            challenge="unlock-now",
            allowed_fingerprints=("abc123",),
        )
    )

    with pytest.raises(SecurityError):
        authorizer.verify(signature="deadbeef", fingerprint="abc123", allow_auto_signature=False)

