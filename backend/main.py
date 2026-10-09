"""
Main FastAPI application — Provenance + Detection Hybrid Trust System.
"""
import json
import shutil
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

import crypto_utils
import database
from detector import run_detection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Provenance + Detection API",
    description="Hybrid digital trust system against deepfakes",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MANIFEST_DIR = Path(__file__).parent / "manifests"
MANIFEST_DIR.mkdir(exist_ok=True)

# Serve the frontend
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/app", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    database.init_db()
    logger.info("Database initialised.")
    logger.info(f"Public key (hex): {crypto_utils.get_public_key_hex()}")


# ---------------------------------------------------------------------------
# Health / info
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "public_key": crypto_utils.get_public_key_hex()}


# ---------------------------------------------------------------------------
# SIGN endpoint
# ---------------------------------------------------------------------------

@app.post("/api/sign")
async def sign_file(
    file: UploadFile = File(...),
    device_id: str = Form(default="web-upload"),
    note: str = Form(default=""),
):
    """
    Upload a file, compute SHA-256, sign with Ed25519, store manifest.
    Returns the manifest JSON + signature.
    """
    # Save uploaded file
    ext = Path(file.filename).suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Compute hash
    file_hash = crypto_utils.sha256_file(save_path)

    # Check if already signed
    existing = database.get_manifest_by_hash(file_hash)
    if existing:
        # Return existing manifest — identical file re-uploaded
        chain = database.get_custody_chain(existing["id"])
        return {
            "status": "already_signed",
            "message": "This exact file was already signed. Returning existing manifest.",
            "manifest": existing,
            "custody_chain": chain,
        }

    # Build manifest (C2PA-loosely-inspired)
    timestamp = datetime.now(timezone.utc).isoformat()
    manifest = {
        "schema_version": "1.0",
        "file_hash": file_hash,
        "hash_algorithm": "SHA-256",
        "original_filename": file.filename,
        "timestamp": timestamp,
        "device_id": device_id,
        "public_key": crypto_utils.get_public_key_hex(),
        "note": note,
    }

    # Sign the manifest
    signature = crypto_utils.sign_manifest(manifest)

    # Persist
    manifest_id = database.save_manifest(
        file_hash=file_hash,
        filename=file.filename,
        timestamp=timestamp,
        device_id=device_id,
        signature=signature,
        public_key=crypto_utils.get_public_key_hex(),
        metadata={"note": note},
    )

    # Add genesis custody event
    database.add_custody_event(
        manifest_id=manifest_id,
        action="SIGNED",
        actor=device_id,
        note=f"Original capture signed. {note}".strip(),
        new_hash=file_hash,
        new_signature=signature,
        timestamp=timestamp,
    )

    # Write manifest JSON to disk
    manifest_path = MANIFEST_DIR / f"{file_hash[:16]}.json"
    manifest_data = {**manifest, "signature": signature}
    manifest_path.write_text(json.dumps(manifest_data, indent=2))

    # Clean up upload
    save_path.unlink(missing_ok=True)

    return {
        "status": "signed",
        "message": "File signed successfully. Keep your manifest to verify later.",
        "manifest": manifest_data,
        "manifest_id": manifest_id,
    }


# ---------------------------------------------------------------------------
# VERIFY endpoint
# ---------------------------------------------------------------------------

@app.post("/api/verify")
async def verify_file(file: UploadFile = File(...)):
    """
    Upload a file, recompute its hash, look it up in the manifest store,
    and verify the Ed25519 signature.
    """
    # Save temp
    ext = Path(file.filename).suffix
    tmp_path = UPLOAD_DIR / f"tmp_{uuid.uuid4().hex}{ext}"
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        file_hash = crypto_utils.sha256_file(tmp_path)
        manifest_row = database.get_manifest_by_hash(file_hash)

        if manifest_row is None:
            # No manifest — run AI detection fallback
            detection = run_detection(tmp_path)

            database.log_verification(
                file_hash=file_hash,
                filename=file.filename,
                verdict="AI_DETECTION_FALLBACK",
                verdict_type="ai_detection",
                confidence=detection.get("confidence"),
                detail=detection.get("explanation", ""),
            )

            return {
                "status": "no_manifest",
                "verdict": "AI_DETECTION_FALLBACK",
                "verdict_label": "No Provenance — AI Analysis",
                "file_hash": file_hash,
                "message": (
                    "No signed manifest found for this file. "
                    "Running AI-based detection as a best-effort fallback."
                ),
                "detection": detection,
            }

        # Manifest found — verify signature
        manifest_for_verify = {
            "schema_version": manifest_row.get("schema_version", "1.0"),
            "file_hash": manifest_row["file_hash"],
            "hash_algorithm": "SHA-256",
            "original_filename": manifest_row["filename"],
            "timestamp": manifest_row["timestamp"],
            "device_id": manifest_row["device_id"],
            "public_key": manifest_row["public_key"],
            "note": json.loads(manifest_row.get("metadata", "{}")).get("note", ""),
        }

        sig_valid = crypto_utils.verify_manifest_signature(
            manifest_for_verify, manifest_row["signature"]
        )

        chain = database.get_custody_chain(manifest_row["id"])

        if sig_valid:
            verdict = "AUTHENTIC"
            label = "Authentic & Unaltered"
            message = (
                "The file's SHA-256 hash matches the signed manifest, "
                "and the Ed25519 signature is cryptographically valid. "
                "This file has not been modified since it was signed."
            )
        else:
            verdict = "SIGNATURE_BROKEN"
            label = "Signature Invalid"
            message = (
                "A manifest exists for this hash, but the Ed25519 signature "
                "is invalid. The manifest may have been tampered with."
            )

        database.log_verification(
            file_hash=file_hash,
            filename=file.filename,
            verdict=verdict,
            verdict_type="cryptographic",
            confidence=100.0 if sig_valid else 0.0,
            detail=message,
        )

        return {
            "status": "verified",
            "verdict": verdict,
            "verdict_label": label,
            "file_hash": file_hash,
            "message": message,
            "manifest": manifest_row,
            "custody_chain": chain,
            "signature_valid": sig_valid,
        }

    finally:
        tmp_path.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# TAMPER-DEMO endpoint
# ---------------------------------------------------------------------------

@app.post("/api/tamper-demo")
async def tamper_demo(file: UploadFile = File(...)):
    """
    Demonstrate tamper detection: hash the file, check if *this* hash is signed,
    but also check if a *modified* version of any signed file was submitted.
    Used for the hackathon demo: user modifies a signed image externally
    and re-uploads it — the hash won't match the manifest, triggering
    the no-manifest / AI-fallback path clearly labelled as TAMPERED.
    """
    ext = Path(file.filename).suffix
    tmp_path = UPLOAD_DIR / f"tamper_{uuid.uuid4().hex}{ext}"
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        new_hash = crypto_utils.sha256_file(tmp_path)
        manifest_row = database.get_manifest_by_hash(new_hash)

        if manifest_row:
            return {
                "status": "hash_matches",
                "verdict": "AUTHENTIC",
                "verdict_label": "Authentic — No Tampering Detected",
                "message": "The hash matches the signed manifest. The file appears unmodified.",
                "file_hash": new_hash,
            }

        # Hash doesn't match any manifest — tampered or unsigned
        detection = run_detection(tmp_path)

        database.log_verification(
            file_hash=new_hash,
            filename=file.filename,
            verdict="TAMPERED_OR_UNSIGNED",
            verdict_type="tamper_check",
            confidence=detection.get("confidence"),
            detail="Hash mismatch with all signed manifests.",
        )

        return {
            "status": "tampered",
            "verdict": "TAMPERED_OR_UNSIGNED",
            "verdict_label": "Tampered / Not Signed by This System",
            "message": (
                "This file's hash does not match any signed manifest in our system. "
                "If you modified a previously signed file, this demonstrates the tamper detection. "
                "AI analysis has also been run as a supplementary check."
            ),
            "file_hash": new_hash,
            "detection": detection,
        }
    finally:
        tmp_path.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# HISTORY & MANIFESTS
# ---------------------------------------------------------------------------

@app.get("/api/manifests")
def list_manifests():
    """List all signed manifests."""
    return database.get_all_manifests()


@app.get("/api/manifests/{manifest_id}/chain")
def get_chain(manifest_id: int):
    """Get chain-of-custody timeline for a manifest."""
    chain = database.get_custody_chain(manifest_id)
    if not chain:
        raise HTTPException(status_code=404, detail="No chain found for this manifest ID.")
    return chain


@app.get("/api/history")
def get_history(limit: int = 50):
    """Get recent verification history."""
    return database.get_verification_history(limit)


@app.get("/api/public-key")
def public_key():
    return {"public_key": crypto_utils.get_public_key_hex()}


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
