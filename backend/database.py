"""
SQLite database layer for manifest storage and verification history.

Changes (v1.2.0):
  - save_manifest uses INSERT OR IGNORE to preserve manifest immutability;
    returns the existing row-id when a duplicate hash is encountered rather
    than silently overwriting the original signed record.
  - CREATE INDEX on manifests.file_hash and custody_chain.manifest_id.
  - WAL journal mode + PRAGMA foreign_keys=ON for safety.
  - add_viewed_event() convenience wrapper appends a VIEWED custody event.
  - get_stats() returns aggregate dashboard metrics in a single round-trip.
  - get_custody_event_count() fast counter per manifest.
"""
import sqlite3
import json
from pathlib import Path
from contextlib import contextmanager
from datetime import datetime, timezone

DB_PATH = Path(__file__).parent / "provenance.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # WAL mode: readers do not block writers
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def db_context():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create tables and indices if they do not exist."""
    with db_context() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS manifests (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            file_hash   TEXT NOT NULL UNIQUE,
            filename    TEXT NOT NULL,
            timestamp   TEXT NOT NULL,
            device_id   TEXT NOT NULL,
            signature   TEXT NOT NULL,
            public_key  TEXT NOT NULL,
            metadata    TEXT DEFAULT '{}',
            created_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_manifests_file_hash
            ON manifests (file_hash);

        CREATE TABLE IF NOT EXISTS custody_chain (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            manifest_id     INTEGER NOT NULL REFERENCES manifests(id) ON DELETE CASCADE,
            action          TEXT NOT NULL,
            actor           TEXT NOT NULL,
            new_hash        TEXT,
            new_signature   TEXT,
            note            TEXT,
            timestamp       TEXT NOT NULL,
            created_at      TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_custody_manifest_id
            ON custody_chain (manifest_id);

        CREATE TABLE IF NOT EXISTS verification_log (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            file_hash       TEXT NOT NULL,
            filename        TEXT,
            verdict         TEXT NOT NULL,
            verdict_type    TEXT NOT NULL,
            confidence      REAL,
            detail          TEXT,
            created_at      TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_verlog_created
            ON verification_log (created_at DESC);
        """)


# ---------------------------------------------------------------------------
# Manifest CRUD
# ---------------------------------------------------------------------------

def save_manifest(file_hash: str, filename: str, timestamp: str, device_id: str,
                  signature: str, public_key: str, metadata: dict = None) -> int:
    """
    Insert a new manifest row.

    Uses INSERT OR IGNORE so a race-condition or retry never silently
    overwrites the original signed record.  If the hash already exists the
    existing row's id is returned unchanged.
    """
    with db_context() as conn:
        cur = conn.execute(
            """INSERT OR IGNORE INTO manifests
               (file_hash, filename, timestamp, device_id, signature, public_key, metadata)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (file_hash, filename, timestamp, device_id, signature, public_key,
             json.dumps(metadata or {}))
        )
        if cur.lastrowid:
            return cur.lastrowid
        # Row already existed — return its id
        row = conn.execute(
            "SELECT id FROM manifests WHERE file_hash = ?", (file_hash,)
        ).fetchone()
        return row["id"] if row else -1


def get_manifest_by_hash(file_hash: str) -> dict | None:
    with db_context() as conn:
        row = conn.execute(
            "SELECT * FROM manifests WHERE file_hash = ?", (file_hash,)
        ).fetchone()
        return dict(row) if row else None


def get_manifest_by_id(manifest_id: int) -> dict | None:
    """Look up a manifest by its primary key."""
    with db_context() as conn:
        row = conn.execute(
            "SELECT * FROM manifests WHERE id = ?", (manifest_id,)
        ).fetchone()
        return dict(row) if row else None


def get_all_manifests() -> list[dict]:
    with db_context() as conn:
        rows = conn.execute(
            "SELECT * FROM manifests ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def get_manifest_count() -> int:
    """Return total number of signed manifests (for dashboard stats)."""
    with db_context() as conn:
        row = conn.execute("SELECT COUNT(*) AS cnt FROM manifests").fetchone()
        return row["cnt"] if row else 0


# ---------------------------------------------------------------------------
# Chain of custody
# ---------------------------------------------------------------------------

def add_custody_event(manifest_id: int, action: str, actor: str,
                      note: str = "", new_hash: str = None,
                      new_signature: str = None, timestamp: str = None) -> int:
    ts = timestamp or datetime.now(timezone.utc).isoformat()
    with db_context() as conn:
        cur = conn.execute(
            """INSERT INTO custody_chain
               (manifest_id, action, actor, new_hash, new_signature, note, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (manifest_id, action, actor, new_hash, new_signature, note, ts)
        )
        return cur.lastrowid


def add_viewed_event(manifest_id: int, actor: str = "verifier",
                     note: str = "") -> int:
    """
    Append a VIEWED custody event when a file is successfully verified.
    Convenience wrapper so call-sites do not hardcode the action string.
    """
    return add_custody_event(
        manifest_id=manifest_id,
        action="VIEWED",
        actor=actor,
        note=note or "File verified against signed manifest.",
    )


def get_custody_chain(manifest_id: int) -> list[dict]:
    with db_context() as conn:
        rows = conn.execute(
            """SELECT * FROM custody_chain WHERE manifest_id = ?
               ORDER BY created_at ASC""",
            (manifest_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def get_custody_event_count(manifest_id: int) -> int:
    """Return the number of custody events for a given manifest."""
    with db_context() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM custody_chain WHERE manifest_id = ?",
            (manifest_id,)
        ).fetchone()
        return row["cnt"] if row else 0


# ---------------------------------------------------------------------------
# Verification log
# ---------------------------------------------------------------------------

def log_verification(file_hash: str, filename: str, verdict: str,
                     verdict_type: str, confidence: float = None, detail: str = "") -> int:
    with db_context() as conn:
        cur = conn.execute(
            """INSERT INTO verification_log
               (file_hash, filename, verdict, verdict_type, confidence, detail)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (file_hash, filename, verdict, verdict_type, confidence, detail)
        )
        return cur.lastrowid


def get_verification_history(limit: int = 50) -> list[dict]:
    with db_context() as conn:
        rows = conn.execute(
            """SELECT * FROM verification_log ORDER BY created_at DESC LIMIT ?""",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Aggregate stats  (used by /api/stats dashboard endpoint)
# ---------------------------------------------------------------------------

def get_stats() -> dict:
    """Return aggregate counts for the frontend dashboard in a single DB round-trip."""
    with db_context() as conn:
        total_signed = conn.execute(
            "SELECT COUNT(*) AS c FROM manifests"
        ).fetchone()["c"]

        total_verified = conn.execute(
            "SELECT COUNT(*) AS c FROM verification_log"
        ).fetchone()["c"]

        authentic_count = conn.execute(
            "SELECT COUNT(*) AS c FROM verification_log WHERE verdict = 'AUTHENTIC'"
        ).fetchone()["c"]

        ai_count = conn.execute(
            "SELECT COUNT(*) AS c FROM verification_log WHERE verdict_type = 'ai_detection'"
        ).fetchone()["c"]

        tampered_count = conn.execute(
            """SELECT COUNT(*) AS c FROM verification_log
               WHERE verdict IN ('TAMPERED_OR_UNSIGNED','SIGNATURE_BROKEN')"""
        ).fetchone()["c"]

        re_upload_count = conn.execute(
            "SELECT COUNT(*) AS c FROM custody_chain WHERE action = 'RE_UPLOADED'"
        ).fetchone()["c"]

        viewed_count = conn.execute(
            "SELECT COUNT(*) AS c FROM custody_chain WHERE action = 'VIEWED'"
        ).fetchone()["c"]

    return {
        "total_signed": total_signed,
        "total_verified": total_verified,
        "authentic_count": authentic_count,
        "ai_count": ai_count,
        "tampered_count": tampered_count,
        "re_upload_count": re_upload_count,
        "viewed_count": viewed_count,
    }
