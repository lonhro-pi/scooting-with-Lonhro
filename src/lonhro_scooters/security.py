from __future__ import annotations

import hashlib
import hmac
import platform
import socket
from dataclasses import dataclass

from .exceptions import SecurityError


def host_fingerprint() -> str:
    """Stable-ish identifier used to tie unlock requests to one host."""
    raw = "|".join(
        (
            platform.node(),
            platform.machine(),
            platform.system(),
            socket.gethostname(),
        )
    ).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def build_signature(secret: str, challenge: str, fingerprint: str | None = None) -> str:
    material = f"{fingerprint or host_fingerprint()}:{challenge}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), material, hashlib.sha256).hexdigest()


@dataclass(slots=True, frozen=True)
class UnlockProof:
    challenge: str
    signature: str
    fingerprint: str

    @classmethod
    def create(cls, secret: str, challenge: str) -> "UnlockProof":
        fingerprint = host_fingerprint()
        signature = build_signature(secret=secret, challenge=challenge, fingerprint=fingerprint)
        return cls(challenge=challenge, signature=signature, fingerprint=fingerprint)


@dataclass(slots=True, frozen=True)
class AuthorizerConfig:
    shared_secret: str | None
    challenge: str
    allowed_fingerprints: tuple[str, ...] = ()


class HostAuthorizer:
    """Host-side signature gate for unlock-capable profiles.

    This prevents the CLI from sending an unlock/profile packet unless the
    request originates from an approved machine or presents a valid proof
    generated with the shared secret.
    """

    def __init__(self, config: AuthorizerConfig) -> None:
        self.config = config

    def current_fingerprint(self) -> str:
        return host_fingerprint().lower()

    def build_local_proof(self, *, challenge: str | None = None) -> UnlockProof:
        if not self.config.shared_secret:
            raise SecurityError("security.shared_secret must be configured to generate a proof.")
        current = self.current_fingerprint()
        self._assert_fingerprint_allowed(current)
        final_challenge = challenge or self.config.challenge
        return UnlockProof(
            challenge=final_challenge,
            signature=build_signature(self.config.shared_secret, final_challenge, current),
            fingerprint=current,
        )

    def verify(
        self,
        *,
        signature: str | None = None,
        fingerprint: str | None = None,
        challenge: str | None = None,
        allow_auto_signature: bool = True,
    ) -> UnlockProof:
        if not self.config.shared_secret:
            raise SecurityError("security.shared_secret must be configured for signature-gated profiles.")

        final_fingerprint = (fingerprint or self.current_fingerprint()).lower()
        final_challenge = challenge or self.config.challenge
        self._assert_fingerprint_allowed(final_fingerprint)

        if signature is None:
            if not allow_auto_signature:
                raise SecurityError("A signature is required for this profile.")
            if final_fingerprint != self.current_fingerprint():
                raise SecurityError("Automatic signing is only available for the current host.")
            signature = build_signature(self.config.shared_secret, final_challenge, final_fingerprint)

        expected = build_signature(self.config.shared_secret, final_challenge, final_fingerprint)
        if not hmac.compare_digest(expected, signature.lower()):
            raise SecurityError("Unlock signature verification failed.")

        return UnlockProof(
            challenge=final_challenge,
            signature=signature.lower(),
            fingerprint=final_fingerprint,
        )

    def _assert_fingerprint_allowed(self, fingerprint: str) -> None:
        allowed = tuple(item.lower() for item in self.config.allowed_fingerprints)
        if allowed and fingerprint not in allowed:
            raise SecurityError(
                "This host fingerprint is not allowed to unlock the scooter. "
                f"Fingerprint: {fingerprint}"
            )

