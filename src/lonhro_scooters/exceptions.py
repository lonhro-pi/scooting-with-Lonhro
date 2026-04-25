class LonhroError(Exception):
    """Base application error."""


class ConfigError(LonhroError):
    """Invalid user configuration."""


class SecurityError(LonhroError):
    """Access was denied by the host-signature gate."""


class ProtocolError(LonhroError):
    """The scooter returned malformed or unexpected protocol data."""


class HandshakeError(LonhroError):
    """The BLE authentication handshake could not be completed."""


class CommandExecutionError(LonhroError):
    """A requested command profile could not be executed."""
