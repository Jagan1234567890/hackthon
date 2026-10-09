# KEYHOLE Security Architecture & Threat Model

**Version:** 2.4.0  
**Scope:** Authenticated Vault (.keyhole format), Forensic Authenticity Pipeline, and Key Recovery Engine.

---

## 1. Executive Summary

KEYHOLE is a defensive, local-first cryptographic system designed around two mandates:
1. **Confidentiality:** Providing high-assurance authenticated envelope encryption with chunk-level integrity localization and verifiable tamper detection.
2. **Authenticity:** Extracting deterministic physical and biological anomaly signals from synthetic media without overstating detector certainty.

All operations execute strictly in the client sandbox (WebCrypto / local worker memory). No file bytes, hashes, candidate passphrases, or encryption keys ever traverse the network.

---

## 2. Threat Model & Boundaries: What KEYHOLE Protects Against

### 2.1 Confidentiality & Vault Guarantees
- **Ciphertext Indistinguishability (IND-CCA2):** All payload data is encrypted with authenticated ciphers (`AES-256-GCM` or `XChaCha20-Poly1305`). Every chunk receives an explicit 128-bit authentication tag.
- **Envelope Key Wrapping:** Data Encryption Keys (DEKs) are generated per-container by a CSPRNG and wrapped by the Master Key derived from user passphrases using memory-hard `Argon2id` (64MB memory, 3 iterations) or hardened `PBKDF2-HMAC-SHA512` (>=600,000 iterations).
- **Chunk-Level Tamper Localization:** Containers are broken into 64KB authenticated chunks bound to container UUID and chunk index via Additional Authenticated Data (AAD). If any byte is modified in transit or storage, the exact chunk is flagged, and unauthenticated plaintext is refused.
- **Nonce Monotonicity:** Nonces follow a monotonic counter structure per key. Nonce reuse is cryptographically prevented.
- **Merkle Root Integrity:** Chunk tags are assembled into a SHA-256 Merkle root embedded in the container header, enabling swift offline verification without payload decryption.

### 2.2 Authenticity & Forensics Guarantees
- **Calibration Over Absolutism:** Every authenticity score represents a calibrated probability band with explicit uncertainty spread ($\pm 0.08$) and counter-evidence evaluation.
- **C2PA Provenance Chain Validation:** Cryptographic verification of digital signatures and claim assertions from hardware-signed capture devices (e.g., Truepic / Leica).
- **Immutable Audit Ledger:** Every forensic case is linked via an append-only SHA-256 Merkle chain, providing tamper-evident chain of custody.

---

## 3. Residual Risks & What KEYHOLE Does NOT Protect Against

### 3.1 Metadata & Container Size Leaking
- **Power-of-Two Size Bucketing:** While internal filenames and directory paths are encrypted in the container manifest, total container length is padded only to the next power-of-two bucket. An adversary monitoring container size may infer approximate file magnitude.
- **Traffic Analysis & Local Filesystem Access:** Encrypted containers residing on unencrypted host disks remain subject to local OS filesystem metadata (creation timestamps, file size in directory entries).

### 3.2 Host-Level Compromise & Keyloggers
- **Hardware/Kernel Keyloggers:** If the host machine running KEYHOLE is infected with a kernel-level keylogger or screen grabber, passphrase entry and in-memory plaintext cannot be shielded once decrypted.
- **SSD Wear-Leveling & Journaling:** Securely erasing original files on flash memory (SSDs) or copy-on-write filesystems (Btrfs, ZFS, APFS) is inherently non-deterministic due to FTL wear-leveling. Full-disk encryption (BitLocker, FileVault, LUKS) is recommended as the primary host defense.

### 3.3 Media Forensics Fundamental Limits
- **Absence of Evidence is Not Evidence of Absence:** An authentic-consistent score confirms that no known synthetic generator fingerprints or biological discontinuities were detected. It does **not** prove that the media is depicting objective reality.
- **Adversarial Post-Processing:** Aggressive transcoding, low-bitrate compression, or heavy analog re-recording (recording a screen with a phone) obliterates subtle high-frequency PRNU and neural vocoder artifacts, frequently reducing detectors to `INCONCLUSIVE`.
- **Evasion & Weaponization Prohibition:** In accordance with Section 0.3, KEYHOLE explicitly refuses all generative hardening or detector-evasion optimizations.

---

## 4. Cryptographic Primitive Verification

| Primitive | Implementation | Purpose |
|---|---|---|
| `AES-256-GCM` | Browser `crypto.subtle` (Native) | Primary Authenticated Encryption & Chunk AEAD |
| `XChaCha20-Poly1305` | libsodium / WebCrypto Native | Low-power / Mobile Streaming Fallback |
| `Argon2id` | WebAssembly Native Worker | Memory-hard Key Derivation (64MB / 3 iterations) |
| `PBKDF2-HMAC-SHA512`| Browser `crypto.subtle` | Fallback KDF (600,000 iterations minimum) |
| `SHA-256` | Browser `crypto.subtle` | Bit-identical Integrity, Merkle Roots, Case Ledger |

---

## 5. Simple Mode Security Guarantees

Simple mode changes no security behavior, hides no caveat, and both modes share one engine. Plain-language rendering is strictly an additive presentation-layer transform over the exact same underlying cryptographic and forensic data structures. 

- **Zero Softening:** Underneath, every finding maintains its precise cryptographic state. An `INCONCLUSIVE` or `MANIPULATION-INDICATORS-DETECTED` verdict is never softened or concealed.
- **Mandatory Caveats Retained:** Every plain-language card retains the mandatory caveat ("Absence of evidence is not evidence of absence", "Generalization across unseen generators is limited", and the permanent "DETECTION IS NOT PROOF" chip).
- **Strict Local Execution:** Simple mode introduces no network telemetry, no external dictionary APIs, and no third-party tracking. All glossary popovers and readability checks execute 100% locally in-memory.

