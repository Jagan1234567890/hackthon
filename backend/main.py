"""
Main FastAPI application — Provenance + Detection Hybrid Trust System.

Upgrades (v1.2.0):
  - /api/verify and /api/batch-verify: append VIEWED custody event on
    every successful authentic verification so the chain-of-custody log
    reflects who accessed the file and when.
  - /api/sign: temp file is unlinked before the early-return on RE_UPLOADED
    so disk is always cleaned up promptly.
  - _validate_upload: server-side magic-byte MIME check via
    crypto_utils.sniff_mime_type() supplements the browser Content-Type.
  - /api/batch-verify: HTTPException from _save_and_validate_size is now
    caught per-file so one oversized file cannot abort the whole batch.
  - New /api/stats endpoint returns aggregate dashboard metrics.
"""
import json
import shutil
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

import crypto_utils
import database
from detector import run_detection
from crypto_utils import sniff_mime_type

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Provenance + Detection API",
    description="Hybrid digital trust system against deepfakes — v1.2.0",
    version="1.2.0",
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

# Serve the frontend and uploaded files
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/app", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

    @app.get("/", include_in_schema=False)
    def root():
        return RedirectResponse(url="/app/")

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


def _make_safe_stored_filename(file_hash: str, original_filename: str | None, prefix: str = "") -> str:
    """Create a persistent, recognizable filename preserving content hash and original name."""
    ext = Path(original_filename or "upload.bin").suffix or ".bin"
    stem = Path(original_filename or "upload").stem
    safe_stem = "".join(c for c in stem if c.isalnum() or c in "._- ")[:40] or "upload"
    prefix_str = f"{prefix}_" if prefix else ""
    return f"{prefix_str}{file_hash[:16]}_{safe_stem}{ext}"

# ---------------------------------------------------------------------------
# Validation constants
# ---------------------------------------------------------------------------

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

# Allowlisted MIME types accepted by sign / verify / batch-verify
ALLOWED_MIME_TYPES = {
    # Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
    # Video
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    # Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    # Docs
    "application/pdf",
    # Generic binary (some browsers send this for images)
    "application/octet-stream",
}


def _validate_upload(file: UploadFile) -> None:
    """
    Raise HTTPException if the uploaded file fails size or MIME-type checks.
    Must be called BEFORE reading file.file (pointer is at 0 at this point).

    Only the Content-Type header is checked here (fast path, no disk I/O).
    After saving to disk call _validate_magic() for the server-side check.
    """
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{content_type}'. "
                f"Allowed types: images (JPEG/PNG/WebP/GIF/BMP/TIFF), "
                f"video (MP4/MOV/AVI/WebM), audio (MP3/WAV/OGG), PDF."
            ),
        )


def _validate_magic(path: Path) -> None:
    """
    Post-save server-side magic-byte check.
    If the file bytes reveal a MIME type that is not allowlisted the saved
    file is deleted and HTTP 415 is raised.
    Silently passes when the format cannot be determined (unknown = allowed
    rather than blocked, to avoid false positives for legitimate binary types).
    """
    detected = sniff_mime_type(path)
    if detected is not None and detected not in ALLOWED_MIME_TYPES:
        path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=415,
            detail=(
                f"File content detected as '{detected}' which is not permitted. "
                "Only images, video, audio, and PDF files are accepted."
            ),
        )


async def _save_and_validate_size(file: UploadFile, dest: Path) -> None:
    """
    Stream the uploaded file to *dest*, enforcing MAX_FILE_SIZE_BYTES.
    Removes the partial file and raises HTTP 413 if the limit is exceeded.
    """
    written = 0
    try:
        with open(dest, "wb") as out:
            while True:
                chunk = await file.read(65536)
                if not chunk:
                    break
                written += len(chunk)
                if written > MAX_FILE_SIZE_BYTES:
                    out.close()
                    dest.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=413,
                        detail=(
                            f"File exceeds the {MAX_FILE_SIZE_BYTES // (1024*1024)} MB limit. "
                            "Please compress or split the file before uploading."
                        ),
                    )
                out.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {exc}") from exc


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

    If the identical file was already signed:
      - A new 'RE_UPLOADED' custody event is appended to the chain.
      - The existing manifest is returned with status 'already_signed'.
    """
    # --- Validate MIME type before touching disk ---
    _validate_upload(file)

    ext = Path(file.filename or "upload").suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name

    # --- Stream to disk with size guard ---
    await _save_and_validate_size(file, save_path)

    # --- Server-side magic-byte MIME check ---
    _validate_magic(save_path)

    persisted = False
    try:
        # Compute hash
        file_hash = crypto_utils.sha256_file(save_path)

        stored_filename = _make_safe_stored_filename(file_hash, file.filename)
        permanent_path = UPLOAD_DIR / stored_filename

        if permanent_path.exists() and permanent_path != save_path:
            save_path.unlink(missing_ok=True)
            save_path = permanent_path
        elif save_path != permanent_path:
            save_path.rename(permanent_path)
            save_path = permanent_path
        persisted = True
        file_url = f"/uploads/{stored_filename}"

        # --- Check if already signed ---
        existing = database.get_manifest_by_hash(file_hash)
        if existing:
            ts = datetime.now(timezone.utc).isoformat()

            # Append RE_UPLOADED event to the custody chain
            database.add_custody_event(
                manifest_id=existing["id"],
                action="RE_UPLOADED",
                actor=device_id,
                note=(
                    f"File re-uploaded. {note}".strip()
                    if note
                    else "Identical file submitted again — no changes detected."
                ),
                new_hash=file_hash,
                timestamp=ts,
            )

            chain = database.get_custody_chain(existing["id"])

            return {
                "status": "already_signed",
                "message": (
                    "This exact file was already signed. "
                    "A RE_UPLOADED event has been appended to its chain of custody."
                ),
                "manifest": existing,
                "custody_chain": chain,
                "saved_file": {
                    "filename": stored_filename,
                    "url": file_url,
                },
            }

        # --- Build manifest ---
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
            metadata={
                "note": note,
                "stored_filename": stored_filename,
                "file_url": file_url,
            },
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
        manifest_data = {
            **manifest,
            "signature": signature,
            "stored_filename": stored_filename,
            "file_url": file_url,
        }
        manifest_path.write_text(json.dumps(manifest_data, indent=2))

        return {
            "status": "signed",
            "message": "File signed successfully and saved to disk. Keep your manifest to verify later.",
            "manifest": manifest_data,
            "manifest_id": manifest_id,
            "saved_file": {
                "filename": stored_filename,
                "url": file_url,
            },
        }

    finally:
        if not persisted and save_path.exists():
            save_path.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# VERIFY endpoint
# ---------------------------------------------------------------------------

@app.post("/api/verify")
async def verify_file(file: UploadFile = File(...)):
    """
    Upload a file, recompute its hash, look it up in the manifest store,
    and verify the Ed25519 signature.
    """
    _validate_upload(file)

    ext = Path(file.filename or "upload").suffix
    tmp_path = UPLOAD_DIR / f"tmp_{uuid.uuid4().hex}{ext}"

    await _save_and_validate_size(file, tmp_path)
    _validate_magic(tmp_path)

    persisted = False
    try:
        file_hash = crypto_utils.sha256_file(tmp_path)
        manifest_row = database.get_manifest_by_hash(file_hash)

        # Preserve uploaded file on disk
        stored_filename = _make_safe_stored_filename(file_hash, file.filename)
        permanent_path = UPLOAD_DIR / stored_filename

        if permanent_path.exists() and permanent_path != tmp_path:
            tmp_path.unlink(missing_ok=True)
            tmp_path = permanent_path
            saved_filename = permanent_path.name
        elif manifest_row is not None:
            tmp_path.rename(permanent_path)
            tmp_path = permanent_path
            saved_filename = permanent_path.name
        else:
            verified_name = _make_safe_stored_filename(file_hash, file.filename, prefix="verified")
            verified_path = UPLOAD_DIR / verified_name
            if verified_path.exists() and verified_path != tmp_path:
                tmp_path.unlink(missing_ok=True)
                tmp_path = verified_path
            else:
                tmp_path.rename(verified_path)
                tmp_path = verified_path
            saved_filename = verified_name

        persisted = True
        file_url = f"/uploads/{saved_filename}"

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
                "saved_file": {
                    "filename": saved_filename,
                    "url": file_url,
                },
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
            # Append a VIEWED event to the chain of custody
            database.add_viewed_event(
                manifest_id=manifest_row["id"],
                actor="verifier",
                note=f"File verified via /api/verify. filename={file.filename}",
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
            "saved_file": {
                "filename": saved_filename,
                "url": file_url,
            },
        }

    finally:
        if not persisted and tmp_path.exists():
            tmp_path.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# BATCH-VERIFY endpoint  (NEW in v1.1.0)
# ---------------------------------------------------------------------------

@app.post("/api/batch-verify")
async def batch_verify(files: List[UploadFile] = File(...)):
    """
    Verify up to 20 files in a single request.

    Each file is processed independently through the same pipeline as /api/verify
    (hash lookup → signature check → AI fallback).  Results are returned as an
    ordered list that mirrors the submission order.

    Response shape:
    {
      "total": int,
      "results": [
        {
          "filename": str,
          "index": int,          # 0-based
          "status": str,
          "verdict": str,
          "verdict_label": str,
          "file_hash": str,
          "message": str,
          "manifest": dict | null,
          "custody_chain": list,
          "detection": dict | null,
          "error": str | null    # set only when processing failed unexpectedly
        },
        ...
      ]
    }
    """
    MAX_BATCH = 20
    if len(files) == 0:
        raise HTTPException(status_code=422, detail="No files provided.")
    if len(files) > MAX_BATCH:
        raise HTTPException(
            status_code=422,
            detail=f"Too many files. Batch limit is {MAX_BATCH} files per request.",
        )

    results = []

    for idx, file in enumerate(files):
        result: dict = {
            "filename": file.filename or f"file_{idx}",
            "index": idx,
            "status": None,
            "verdict": None,
            "verdict_label": None,
            "file_hash": None,
            "message": None,
            "manifest": None,
            "custody_chain": [],
            "detection": None,
            "error": None,
        }

        tmp_path: Path | None = None
        try:
            # MIME validation
            content_type = (file.content_type or "").split(";")[0].strip().lower()
            if content_type and content_type not in ALLOWED_MIME_TYPES:
                result["status"] = "rejected"
                result["error"] = (
                    f"Unsupported MIME type '{content_type}'. "
                    "Allowed: images, video (MP4/MOV/AVI/WebM), audio, PDF."
                )
                results.append(result)
                continue

            ext = Path(file.filename or "upload").suffix
            tmp_path = UPLOAD_DIR / f"batch_{uuid.uuid4().hex}{ext}"
            await _save_and_validate_size(file, tmp_path)

            # Server-side magic-byte check (per-file, non-fatal for batch)
            try:
                _validate_magic(tmp_path)
            except HTTPException as mime_exc:
                result["status"] = "rejected"
                result["error"] = mime_exc.detail
                results.append(result)
                continue

            persisted = False
            file_hash = crypto_utils.sha256_file(tmp_path)
            result["file_hash"] = file_hash

            stored_batch_name = _make_safe_stored_filename(file_hash, file.filename, prefix="batch")
            batch_perm = UPLOAD_DIR / stored_batch_name
            if batch_perm.exists() and batch_perm != tmp_path:
                tmp_path.unlink(missing_ok=True)
                tmp_path = batch_perm
            else:
                tmp_path.rename(batch_perm)
                tmp_path = batch_perm
            persisted = True
            result["saved_file"] = {"filename": stored_batch_name, "url": f"/uploads/{stored_batch_name}"}

            manifest_row = database.get_manifest_by_hash(file_hash)

            if manifest_row is None:
                # AI fallback
                detection = run_detection(tmp_path)
                database.log_verification(
                    file_hash=file_hash,
                    filename=file.filename,
                    verdict="AI_DETECTION_FALLBACK",
                    verdict_type="ai_detection",
                    confidence=detection.get("confidence"),
                    detail=detection.get("explanation", ""),
                )
                result.update(
                    status="no_manifest",
                    verdict="AI_DETECTION_FALLBACK",
                    verdict_label="No Provenance — AI Analysis",
                    message=(
                        "No signed manifest found. "
                        "AI analysis run as best-effort fallback."
                    ),
                    detection=detection,
                )
            else:
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
                    verdict, label, message = (
                        "AUTHENTIC",
                        "Authentic & Unaltered",
                        "Hash and Ed25519 signature are valid.",
                    )
                else:
                    verdict, label, message = (
                        "SIGNATURE_BROKEN",
                        "Signature Invalid",
                        "Manifest found but Ed25519 signature is invalid.",
                    )

                database.log_verification(
                    file_hash=file_hash,
                    filename=file.filename,
                    verdict=verdict,
                    verdict_type="cryptographic",
                    confidence=100.0 if sig_valid else 0.0,
                    detail=message,
                )
                # Append VIEWED event on authentic batch results
                if sig_valid:
                    database.add_viewed_event(
                        manifest_id=manifest_row["id"],
                        actor="batch-verifier",
                        note=f"Batch-verified. filename={file.filename}",
                    )
                result.update(
                    status="verified",
                    verdict=verdict,
                    verdict_label=label,
                    message=message,
                    manifest=manifest_row,
                    custody_chain=chain,
                )

        except HTTPException as exc:
            result["status"] = "rejected"
            result["error"] = exc.detail
            if tmp_path and tmp_path.exists():
                tmp_path.unlink(missing_ok=True)
                tmp_path = None
        except Exception as exc:
            logger.exception(f"Batch-verify error for file {idx} ({file.filename})")
            result["status"] = "error"
            result["error"] = str(exc)
        finally:
            if tmp_path and not persisted and tmp_path.exists():
                tmp_path.unlink(missing_ok=True)

        results.append(result)

    authentic = sum(1 for r in results if r.get("verdict") == "AUTHENTIC")
    tampered  = sum(1 for r in results if r.get("verdict") in ("SIGNATURE_BROKEN", "TAMPERED_OR_UNSIGNED"))
    ai_checked = sum(1 for r in results if r.get("verdict") == "AI_DETECTION_FALLBACK")
    errors     = sum(1 for r in results if r.get("status") in ("error", "rejected"))

    return {
        "total": len(results),
        "summary": {
            "authentic": authentic,
            "tampered": tampered,
            "ai_checked": ai_checked,
            "errors": errors,
        },
        "results": results,
    }


# ---------------------------------------------------------------------------
# TAMPER-DEMO endpoint
# ---------------------------------------------------------------------------

@app.post("/api/tamper-demo")
async def tamper_demo(file: UploadFile = File(...)):
    """
    Demonstrate tamper detection: hash the file, check if *this* hash is signed,
    but also check if a *modified* version of any signed file was submitted.
    """
    _validate_upload(file)

    ext = Path(file.filename or "upload").suffix
    tmp_path = UPLOAD_DIR / f"tamper_{uuid.uuid4().hex}{ext}"
    await _save_and_validate_size(file, tmp_path)
    _validate_magic(tmp_path)

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


@app.get("/api/stats")
def get_stats():
    """
    Aggregate dashboard metrics — single DB round-trip.

    Returns counts of:
      - total_signed: number of signed manifests
      - total_verified: total verification attempts
      - authentic_count: verifications that passed
      - ai_count: AI-fallback verifications
      - tampered_count: tampered / broken-signature verdicts
      - re_upload_count: RE_UPLOADED custody events
      - viewed_count: VIEWED custody events
    """
    return database.get_stats()


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
