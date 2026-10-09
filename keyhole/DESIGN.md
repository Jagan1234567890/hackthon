# KEYHOLE Design System & Token Architecture

**Version:** 2.4.0  
**Inspirations:** Linear, Raycast, Framer  
**Mode:** Hyper-Dark Void Canvas (Dark Only — No White Flash)

---

## 1. Color Tokens (OKLCH System)

All colors are defined strictly in OKLCH to preserve luminance parity and eliminate ad-hoc hex values:

| Token | OKLCH Value | Hex Approx | Role & Semantics |
|---|---|---|---|
| `--background` | `oklch(0.02 0 0)` | `#050505` | Void black canvas base |
| `--foreground` | `oklch(0.985 0 0)` | `#FAFAFA` | High-contrast headings and primary typography |
| `--muted-foreground` | `oklch(0.66 0.015 280)` | `#A3A3A3` | Soft silver-grey descriptions and metadata |
| `--primary` | `oklch(0.62 0.22 295)` | `#A855F7` | Electric violet primary accent (brand only, never used for danger) |
| `--surface` | `oklch(0.08 0.005 280)` | `#141416` | Base container and navigation pill surface |
| `--surface-elevated` | `oklch(0.11 0.008 280)` | `#1C1C20` | Elevated inspector drawers, dialogs, and modals |
| `--surface-hover` | `oklch(0.15 0.01 280)` | `#26262B` | Hover interactive surface |
| `--border` | `oklch(0.22 0.01 280 / 60%)` | — | Ultra-thin hairline boundary structure |
| `--border-highlight` | `oklch(0.4 0.12 295 / 50%)` | — | Subtle violet border glow on card hover |
| `--success` | `oklch(0.72 0.17 155)` | `#22C55E` | `AUTHENTIC-CONSISTENT` / `RECOVERED` / Integrity verified |
| `--warning` | `oklch(0.78 0.15 85)` | `#EAB308` | `INCONCLUSIVE` / `LIKELY RECOVERABLE` / Kill criterion warning |
| `--danger` | `oklch(0.63 0.2 25)` | `#EF4444` | `MANIPULATION-INDICATORS-DETECTED` / `INFEASIBLE` / Tamper alert |
| `--info` | `oklch(0.7 0.13 235)` | `#38BDF8` | Telemetry metrics / C2PA information |

---

## 2. Atmospheric Depth & Kinetic System

- **Atmospheric Depth Gradients:**
  - `radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.35 0.2 295 / 0.35), transparent 60%)`
  - `radial-gradient(ellipse 60% 40% at 80% 40%, oklch(0.3 0.18 295 / 0.18), transparent 70%)`
- **Glass Primitive (`.glass`):**
  - `background: color-mix(in oklab, var(--surface) 60%, transparent);`
  - `backdrop-filter: blur(16px) saturate(140%);`
  - `border: 1px solid var(--border);`
- **3D Cursor Tilt:** Perspective 1000px, capped at $\pm 6^\circ$, springs back smoothly on leave.
- **Cursor Spotlight & Canvas FX:** Single `requestAnimationFrame` loop with lerped coordinates rendering radial violet glow, stardust particles, and $215^\circ$ diagonal meteor streaks. Disabled under `prefers-reduced-motion`.

---

## 3. Product Surfaces Matrix

1. **Landing Page:** Interactive hero with live tilted console preview, format marquee, two-column methodology ladder, ethics panel, transparent pricing, and footer.
2. **Authenticity Console (Half 1):** Ingestion drop zone, modality selector (Photo/Video/Audio), C2PA provenance validator, FFT/noise residuals, video temporal blink/ID drift, audio vocoder seams, frame scrubber, heatmap overlay, and counter-evidence evaluation.
3. **Vault Console (Half 2):** Sealed store tree view, drop-to-seal panel, Diceware passphrase generator, Argon2id auto-calibration, per-chunk Merkle verification, key rotation, tamper banner, and age/OpenPGP export.
4. **Recovery Console:** 6-stage cheapest-first recovery ladder, candidate ranking table, budgeted offline cracking with kill criteria, and 4-state terminal result drawer.
5. **Immutable Case Ledger:** Hash-chained audit journal anchoring every case with SHA-256 Merkle links and independent re-verification.
6. **Settings & Model Registry:** Operational threshold sliders (false-positive / false-negative tolerance), pinned open-weight model checksums, hardware budget, and privacy redaction rules.

---

## 4. Language & Plain-Language Layer (Simple Mode)

### 4.1 Plain-Language Architecture & Single Source of Truth
Simple Mode provides an accessible, jargon-free primary presentation without compromising mathematical or forensic rigor. Both Simple and Expert modes consume the identical underlying verdict engine and state store.
- **Mapping Table (`plainCopy.ts`):** Centralized, typed dictionary mapping all engine verdicts (`MANIPULATION-INDICATORS-DETECTED`, `INCONCLUSIVE`, `AUTHENTIC-CONSISTENT`, `RECOVERED`, `LIKELY RECOVERABLE`, `LONG SHOT`, `INFEASIBLE`, and vault states) to active-voice, second-person sentences.
- **The 18-Word Rule:** Every user-facing sentence in Simple Mode is hard-capped at a maximum of 18 words.
- **Readability Ceiling:** Enforces Flesch-Kincaid Grade Level $\le 8.0$ (measured via automated test runner).
- **Prohibited Softening:** An `INCONCLUSIVE` verdict is never softened to "probably real" or "fine"; verdicts reflect reality 1:1.

### 4.2 Glossary Contract & Progressive Disclosure
Technical nouns (e.g., *metadata*, *fingerprint (hash)*, *KDF*, *entropy*, *C2PA*, *nonce*) must resolve to an entry in `GLOSSARY_DICTIONARY` and are rendered as dotted-underlined interactive tokens:
- **Hover/Focus Latency:** Opens a glass popover after 120ms delay (preventing sweep flicker) with a 200ms transition.
- **Structure:** Two-line plain explanation followed by an "In technical terms" reference.
- **Keyboard Navigation:** Fully accessible `<button>` element with `aria-describedby` and Escape-key dismiss.

### 4.3 Escape Hatch Accordion
Every Simple Mode verdict card features an inline "Show the technical detail" trigger. Expanding it reveals the corresponding Expert rows (raw command output, model version hashes, calibrated uncertainty band, and counter-evidence hypotheses) inline without page navigation or modal interruption.

