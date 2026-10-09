"""
Cryptographic utilities for the Provenance system.
Ed25519 signing via PyNaCl + SHA-256 hashing via hashlib.

Changes (v1.2.0):
  - verify_manifest_signature: fix double-padding by stripping existing '='
    before re-padding, preventing base64.binascii.Error on already-padded tokens.
  - sniff_mime_type(): magic-byte inspector for server-side content-type
    verification independent of the browser-supplied Content-Type header.
"""
import hashlib
import json
import os
import base64
import struct
from pathlib import Path

import nacl.signing
import nacl.encoding
import nacl.exceptions


KEY_DIR = Path(__file__).parent / "keys"
KEY_DIR.mkdir(exist_ok=True)
SIGNING_KEY_PATH = KEY_DIR / "signing_key.bin"
VERIFY_KEY_PATH = KEY_DIR / "verify_key.bin"


# ---------------------------------------------------------------------------
# Key management
# ---------------------------------------------------------------------------

def _load_or_generate_keypair() -> tuple[nacl.signing.SigningKey, nacl.signing.VerifyKey]:
    """Load existing Ed25519 keypair from disk, or generate and save a new one."""
    if SIGNING_KEY_PATH.exists() and VERIFY_KEY_PATH.exists():
        signing_key = nacl.signing.SigningKey(SIGNING_KEY_PATH.read_bytes())
        verify_key = signing_key.verify_key
    else:
        signing_key = nacl.signing.SigningKey.generate()
        SIGNING_KEY_PATH.write_bytes(bytes(signing_key))
        VERIFY_KEY_PATH.write_bytes(bytes(signing_key.verify_key))
    return signing_key, signing_key.verify_key


SIGNING_KEY, VERIFY_KEY = _load_or_generate_keypair()


def get_public_key_hex() -> str:
    """Return the verify (public) key as a hex string."""
    return VERIFY_KEY.encode(encoder=nacl.encoding.HexEncoder).decode()


# ---------------------------------------------------------------------------
# Hashing
# ---------------------------------------------------------------------------

def sha256_file(path: str | Path) -> str:
    """Compute SHA-256 hex digest of a file, reading in chunks."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# ---------------------------------------------------------------------------
# Signing & verification
# ---------------------------------------------------------------------------

def sign_manifest(manifest: dict) -> str:
    """
    Canonicalize the manifest dict (sorted keys) and sign it.
    Returns the signature as a base64url string.
    """
    payload = json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()
    signed = SIGNING_KEY.sign(payload)
    # signed.signature is the 64-byte detached signature
    return base64.urlsafe_b64encode(signed.signature).decode()


def verify_manifest_signature(manifest: dict, signature_b64: str) -> bool:
    """
    Re-canonicalize manifest and verify the signature.
    Returns True if valid, False otherwise.

    The incoming token may or may not carry trailing '=' padding; we strip
    any existing padding before adding exactly the right amount to avoid
    binascii.Error on already-padded strings.
    """
    try:
        payload = json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()
        # Strip stale padding, then re-pad to a multiple of 4
        b64 = signature_b64.rstrip("=")
        b64 += "=" * (-len(b64) % 4)
        sig_bytes = base64.urlsafe_b64decode(b64)
        VERIFY_KEY.verify(payload, sig_bytes)
        return True
    except (nacl.exceptions.BadSignatureError, Exception):
        return False


# ---------------------------------------------------------------------------
# Magic-byte MIME sniffing  (server-side guard, independent of browser header)
# ---------------------------------------------------------------------------

# Mapping of (offset, magic_bytes) → canonical MIME type
_MAGIC: list[tuple[int, bytes, str]] = [
    (0, b"\xff\xd8\xff",                    "image/jpeg"),
    (0, b"\x89PNG\r\n\x1a\n",              "image/png"),
    (0, b"GIF87a",                           "image/gif"),
    (0, b"GIF89a",                           "image/gif"),
    (0, b"RIFF",                             "image/webp"),  # refined below
    (0, b"BM",                               "image/bmp"),
    (0, b"\x00\x00\x00\x0cftyp",            "video/mp4"),   # simplified
    (0, b"\x1aE\xdf\xa3",                   "video/webm"),
    (0, b"%PDF",                             "application/pdf"),
    (0, b"ID3",                              "audio/mpeg"),
    (0, b"\xff\xfb",                         "audio/mpeg"),
    (0, b"RIFF",                             "audio/wav"),   # refined below
    (0, b"OggS",                             "audio/ogg"),
]


def sniff_mime_type(path: Path, max_read: int = 16) -> str | None:
    """
    Read the first *max_read* bytes of *path* and return a best-guess MIME
    type string, or None when the format is unrecognised.

    This is used as a server-side sanity check *after* the file is saved to
    disk, making it independent of the browser-supplied Content-Type header.
    """
    try:
        header = path.read_bytes()[:max_read]
    except OSError:
        return None

    # RIFF container: check bytes 8-11 to distinguish WAV vs WebP
    if header[:4] == b"RIFF" and len(header) >= 12:
        sub = header[8:12]
        if sub == b"WAVE":
            return "audio/wav"
        if sub == b"WEBP":
            return "image/webp"

    # ftyp box: mp4 / quicktime / avi
    if len(header) >= 8 and header[4:8] == b"ftyp":
        brand = header[8:12] if len(header) >= 12 else b""
        if brand in (b"qt  ", b"M4V ", b"M4A "):
            return "video/quicktime"
        return "video/mp4"

    # AVI: RIFF....AVI 
    if header[:4] == b"RIFF" and len(header) >= 12 and header[8:11] == b"AVI":
        return "video/x-msvideo"

    for offset, magic, mime in _MAGIC:
        end = offset + len(magic)
        if len(header) >= end and header[offset:end] == magic:
            return mime

    return None
