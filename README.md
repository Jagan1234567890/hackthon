# TrustMark — Provenance + Detection System

A hackathon prototype for the **Deepfake, Synthetic Media & Digital Trust** track.

## Demo Flow (2 minutes)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Upload photo → **Sign** tab | 🔏 "Signed & Secured" with hash + manifest |
| 2 | Upload same photo → **Verify** tab | ✅ Green "Authentic & Unaltered" badge |
| 3 | Edit photo externally (any change) → **Tamper Demo** tab | 🚨 Red "Tampered" badge, hash mismatch shown |
| 4 | Upload unknown/deepfake image → **AI Detect** tab | 🤖 Confidence score with plain-language explanation |

## Quick Start

```
# Windows — double-click:
start.bat

# Or manually:
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
# Then open: http://localhost:8000/app/index.html
```

## Architecture

```
hackathon/
├── backend/
│   ├── main.py          # FastAPI app — all API routes
│   ├── crypto_utils.py  # Ed25519 signing + SHA-256 hashing (PyNaCl)
│   ├── database.py      # SQLite: manifests, custody chain, verify log
│   ├── detector.py      # HuggingFace AI deepfake detector (SigLIP)
│   ├── keys/            # Ed25519 keypair (auto-generated on first run)
│   ├── manifests/       # Signed manifest JSON files
│   └── requirements.txt
├── frontend/
│   ├── index.html       # Single-page app
│   ├── style.css        # Full design system (dark mode, glassmorphism)
│   └── app.js           # Tab logic, API calls, result rendering
├── start.bat            # One-click Windows launcher
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/sign` | Upload → hash → sign → store manifest |
| `POST` | `/api/verify` | Upload → check hash → verify signature or run AI |
| `POST` | `/api/tamper-demo` | Check if file hash matches any signed manifest |
| `GET`  | `/api/manifests` | List all signed manifests |
| `GET`  | `/api/manifests/{id}/chain` | Chain-of-custody timeline |
| `GET`  | `/api/history` | Recent verification events |
| `GET`  | `/api/health` | Server health + public key |
| `GET`  | `/docs` | Interactive Swagger UI |

## Core Concepts

### Provenance Path (signed content)
1. File uploaded → SHA-256 fingerprint computed
2. Manifest built: `{hash, filename, timestamp, device_id, public_key, note}`
3. Manifest signed with **Ed25519** (PyNaCl) — Ed25519 is fast, compact, and resistant to side-channel attacks
4. Manifest + signature stored in SQLite
5. On verification: recompute hash → look up manifest → verify signature cryptographically

### Detection Fallback (unsigned content)
- Uses [`prithivMLmods/deepfake-detector-model-v1`](https://huggingface.co/prithivMLmods/deepfake-detector-model-v1)
- SigLIP-based binary classifier (Real vs Fake)
- Returns probability score with plain-language explanation
- Honest disclaimer shown: result is probabilistic, not a guarantee

### Honest Limitations (as shown in UI)
- Provenance only covers files signed **by this system**
- AI detector is a best-effort fallback — not a guarantee
- Model downloaded on first AI detection run (~350 MB)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Crypto | PyNaCl (Ed25519), hashlib (SHA-256) |
| Manifest | SQLite + JSON (C2PA-inspired) |
| AI Detection | HuggingFace `transformers`, PyTorch, SigLIP |
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| Charts | Chart.js |
