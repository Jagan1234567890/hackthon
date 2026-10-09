"""
Cryptographic utilities for the Provenance system.
Ed25519 signing via PyNaCl + SHA-256 hashing via hashlib.
"""
import hashlib
import json
import os
import base64
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
    """
    try:
        payload = json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()
        sig_bytes = base64.urlsafe_b64decode(signature_b64 + "==")  # pad safely
        VERIFY_KEY.verify(payload, sig_bytes)
        return True
    except (nacl.exceptions.BadSignatureError, Exception):
        return False
