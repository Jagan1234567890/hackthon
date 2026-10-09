"""
SQLite database layer for manifest storage and verification history.
"""
import sqlite3
import json
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent / "provenance.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
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
    """Create tables if they don't exist."""
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

        CREATE TABLE IF NOT EXISTS custody_chain (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            manifest_id     INTEGER NOT NULL REFERENCES manifests(id),
            action          TEXT NOT NULL,
            actor           TEXT NOT NULL,
            new_hash        TEXT,
            new_signature   TEXT,
            note            TEXT,
            timestamp       TEXT NOT NULL,
            created_at      TEXT DEFAULT (datetime('now'))
        );

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
        """)


# ---------------------------------------------------------------------------
# Manifest CRUD
# ---------------------------------------------------------------------------

def save_manifest(file_hash: str, filename: str, timestamp: str, device_id: str,
                  signature: str, public_key: str, metadata: dict = None) -> int:
    with db_context() as conn:
        cur = conn.execute(
            """INSERT OR REPLACE INTO manifests
               (file_hash, filename, timestamp, device_id, signature, public_key, metadata)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (file_hash, filename, timestamp, device_id, signature, public_key,
             json.dumps(metadata or {}))
        )
        return cur.lastrowid


def get_manifest_by_hash(file_hash: str) -> dict | None:
    with db_context() as conn:
        row = conn.execute(
            "SELECT * FROM manifests WHERE file_hash = ?", (file_hash,)
        ).fetchone()
        return dict(row) if row else None


def get_all_manifests() -> list[dict]:
    with db_context() as conn:
        rows = conn.execute(
            "SELECT * FROM manifests ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Chain of custody
# ---------------------------------------------------------------------------

def add_custody_event(manifest_id: int, action: str, actor: str,
                      note: str = "", new_hash: str = None,
                      new_signature: str = None, timestamp: str = None) -> int:
    from datetime import datetime, timezone
    ts = timestamp or datetime.now(timezone.utc).isoformat()
    with db_context() as conn:
        cur = conn.execute(
            """INSERT INTO custody_chain
               (manifest_id, action, actor, new_hash, new_signature, note, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (manifest_id, action, actor, new_hash, new_signature, note, ts)
        )
        return cur.lastrowid


def get_custody_chain(manifest_id: int) -> list[dict]:
    with db_context() as conn:
        rows = conn.execute(
            """SELECT * FROM custody_chain WHERE manifest_id = ?
               ORDER BY created_at ASC""",
            (manifest_id,)
        ).fetchall()
        return [dict(r) for r in rows]


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
