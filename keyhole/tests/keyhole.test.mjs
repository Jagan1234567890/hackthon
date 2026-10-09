import test from 'node:test';
import assert from 'node:assert/strict';

// -------------------------------------------------------------
// Test 1: Crypto Helpers & Diceware Passphrase Generation
// -------------------------------------------------------------
const DICEWARE_WORDS = [
  'anchor', 'badge', 'beacon', 'canyon', 'canvas', 'carbon', 'cipher', 'clover',
  'cobalt', 'crater', 'crystal', 'delta', 'drifter', 'echo', 'ember', 'falcon',
  'flint', 'fossil', 'galaxy', 'glacier', 'granite', 'harbor', 'horizon', 'indigo',
  'iron', 'island', 'jupiter', 'keystone', 'lagoon', 'lantern', 'meteor', 'nebula',
  'nexus', 'obsidian', 'orbit', 'pebble', 'pinnacle', 'pulsar', 'pyramid', 'quartz',
  'radar', 'ranger', 'relic', 'ridge', 'rocket', 'sentry', 'shadow', 'signal',
  'silver', 'solstice', 'spark', 'summit', 'temple', 'titan', 'tracer', 'vanguard',
  'vector', 'vertex', 'vortex', 'whisper', 'zenith', 'zephyr', 'zero', 'zodiac',
];

function generateDicewarePassphrase(wordCount = 6) {
  const words = [];
  const randomBuffer = new Uint32Array(wordCount);
  crypto.getRandomValues(randomBuffer);
  for (let i = 0; i < wordCount; i++) {
    const idx = randomBuffer[i] % DICEWARE_WORDS.length;
    words.push(DICEWARE_WORDS[idx]);
  }
  return words.join('-');
}

test('Diceware Generator produces correct word count and entropy format', () => {
  const phrase = generateDicewarePassphrase(6);
  const words = phrase.split('-');
  assert.equal(words.length, 6);
  for (const w of words) {
    assert.ok(DICEWARE_WORDS.includes(w));
  }
  assert.notEqual(generateDicewarePassphrase(6), generateDicewarePassphrase(6));
});

// -------------------------------------------------------------
// Test 2: .keyhole Format Header & AAD Chunk Envelope Cryptography
// -------------------------------------------------------------
async function deriveMasterKey(passphrase, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000, // fast iterations for test runner
      hash: 'SHA-512',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

test('.keyhole Streaming AEAD Container: Round-trip & Tamper Localization', async () => {
  const passphrase = 'relic-summit-falcon-granite-nebula-vanguard';
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const masterKey = await deriveMasterKey(passphrase, salt);

  // Generate and wrap DEK
  const dek = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const rawDek = await crypto.subtle.exportKey('raw', dek);
  const dekNonce = crypto.getRandomValues(new Uint8Array(12));
  const wrappedDek = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: dekNonce },
    masterKey,
    rawDek
  );

  const containerId = 'test-container-uuid-42';
  const encoder = new TextEncoder();
  const payloadChunk0 = encoder.encode('Confidential Segment Alpha - Keyhole Forensics');
  const payloadChunk1 = encoder.encode('Confidential Segment Beta - Tamper Verification');

  // Encrypt Chunk 0 with AAD binding containerId:0:2
  const nonce0 = crypto.getRandomValues(new Uint8Array(12));
  const aad0 = encoder.encode(`${containerId}:0:2`);
  const ciphertext0 = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce0, additionalData: aad0, tagLength: 128 },
    dek,
    payloadChunk0
  );

  // Encrypt Chunk 1 with AAD binding containerId:1:2
  const nonce1 = crypto.getRandomValues(new Uint8Array(12));
  const aad1 = encoder.encode(`${containerId}:1:2`);
  const ciphertext1 = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce1, additionalData: aad1, tagLength: 128 },
    dek,
    payloadChunk1
  );

  // Verification 2a: Valid unwrap of DEK with correct passphrase
  const unwrappedRawDek = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: dekNonce },
    masterKey,
    wrappedDek
  );
  assert.deepEqual(new Uint8Array(unwrappedRawDek), new Uint8Array(rawDek));

  // Verification 2b: Successful decrypt of Chunk 0
  const decrypted0 = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce0, additionalData: aad0, tagLength: 128 },
    dek,
    ciphertext0
  );
  assert.equal(new TextDecoder().decode(decrypted0), 'Confidential Segment Alpha - Keyhole Forensics');

  // Verification 2c: Tamper localization in Chunk 1
  const tamperedCiphertext1 = new Uint8Array(ciphertext1);
  tamperedCiphertext1[5] ^= 0xff; // Flip bits at byte 5

  await assert.rejects(
    async () => {
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce1, additionalData: aad1, tagLength: 128 },
        dek,
        tamperedCiphertext1
      );
    },
    /OperationError/
  );

  // Verification 2d: Rejection on wrong passphrase (Zero leak)
  const wrongMasterKey = await deriveMasterKey('incorrect-passphrase-attempt', salt);
  await assert.rejects(
    async () => {
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: dekNonce },
        wrongMasterKey,
        wrappedDek
      );
    },
    /OperationError/
  );
});

// -------------------------------------------------------------
// Test 3: Authenticity Fusion & Calibration Math
// -------------------------------------------------------------
function fuseAndCalibrateSignals(signals, fpTolerance, fnTolerance, c2paStatus) {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const s of signals) {
    weightedSum += s.score * s.weight;
    totalWeight += s.weight;
  }

  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;

  const dynamicFpThreshold = 0.55 + fpTolerance * 0.5;
  const dynamicFnThreshold = 0.45 - fnTolerance * 0.5;

  let verdict = 'INCONCLUSIVE';

  if (c2paStatus === 'VERIFIED AUTHENTIC' && rawScore < 0.35) {
    verdict = 'AUTHENTIC-CONSISTENT';
  } else if (rawScore >= dynamicFpThreshold) {
    verdict = 'MANIPULATION-INDICATORS-DETECTED';
  } else if (rawScore <= dynamicFnThreshold) {
    verdict = 'AUTHENTIC-CONSISTENT';
  }

  return { verdict, rawScore };
}

test('Fusion Engine: Correct 3-state output and threshold sensitivity', () => {
  const authenticSignals = [
    { score: 0.15, weight: 1.4 },
    { score: 0.20, weight: 1.1 },
    { score: 0.18, weight: 1.0 },
  ];
  const authenticResult = fuseAndCalibrateSignals(authenticSignals, 0.1, 0.1, 'NO PROVENANCE DATA');
  assert.equal(authenticResult.verdict, 'AUTHENTIC-CONSISTENT');

  const manipulatedSignals = [
    { score: 0.85, weight: 1.4 },
    { score: 0.90, weight: 1.1 },
    { score: 0.82, weight: 1.0 },
  ];
  const manipulatedResult = fuseAndCalibrateSignals(manipulatedSignals, 0.1, 0.1, 'NO PROVENANCE DATA');
  assert.equal(manipulatedResult.verdict, 'MANIPULATION-INDICATORS-DETECTED');

  const conflictingSignals = [
    { score: 0.85, weight: 1.0 },
    { score: 0.15, weight: 1.0 },
  ];
  const inconclusiveResult = fuseAndCalibrateSignals(conflictingSignals, 0.1, 0.1, 'NO PROVENANCE DATA');
  assert.equal(inconclusiveResult.verdict, 'INCONCLUSIVE');
});

// -------------------------------------------------------------
// Test 4: Immutable Ledger Sequential Hash Chain
// -------------------------------------------------------------
async function hashRecord(record, previousChainHash) {
  const payload = JSON.stringify({ ...record, previousChainHash });
  const buf = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

test('Ledger Engine: Sequential Merkle Chain Verification & Tamper Detection', async () => {
  const rec1 = { caseId: 'case_1', inputHash: 'abc', verdict: 'AUTHENTIC-CONSISTENT' };
  const h1 = await hashRecord(rec1, '0'.repeat(64));

  const rec2 = { caseId: 'case_2', inputHash: 'def', verdict: 'MANIPULATION-INDICATORS-DETECTED' };
  const h2 = await hashRecord(rec2, h1);

  assert.equal(typeof h1, 'string');
  assert.equal(h1.length, 64);
  assert.equal(typeof h2, 'string');
  assert.equal(h2.length, 64);

  // If rec1 is tampered:
  const tamperedRec1 = { ...rec1, verdict: 'INCONCLUSIVE' };
  const recomputedH1 = await hashRecord(tamperedRec1, '0'.repeat(64));
  assert.notEqual(recomputedH1, h1);

  // Cascade break to h2
  const recomputedH2 = await hashRecord(rec2, recomputedH1);
  assert.notEqual(recomputedH2, h2);
});
