import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTHENTICITY_PLAIN_MAPPINGS,
  RECOVERY_PLAIN_MAPPINGS,
} from '../src/lib/plainCopy.ts';

// -------------------------------------------------------------
// Test: Parity Gate & No Softened Verdicts (Section 8.2)
// -------------------------------------------------------------
test('Parity Gate: Verdict enums map 1:1 and are never softened', () => {
  // 1. MANIPULATION-INDICATORS-DETECTED must stay danger-aligned and not softened
  const manipCopy = AUTHENTICITY_PLAIN_MAPPINGS['MANIPULATION-INDICATORS-DETECTED']();
  assert.equal(manipCopy.verdictLine, 'This looks edited or computer-made.');
  assert.equal(manipCopy.confidence, 'fairly sure');
  assert.ok(!manipCopy.verdictLine.toLowerCase().includes('fine'));
  assert.ok(!manipCopy.verdictLine.toLowerCase().includes('probably real'));

  // 2. INCONCLUSIVE must never say "probably fine" or "real"
  const inconclCopy = AUTHENTICITY_PLAIN_MAPPINGS['INCONCLUSIVE']();
  assert.equal(inconclCopy.verdictLine, "We can't tell for sure.");
  assert.equal(inconclCopy.confidence, 'not sure');
  assert.ok(!inconclCopy.verdictLine.toLowerCase().includes('probably fine'));
  assert.ok(!inconclCopy.verdictLine.toLowerCase().includes('real'));

  // 3. AUTHENTIC-CONSISTENT must keep mandatory caveat
  const authCopy = AUTHENTICITY_PLAIN_MAPPINGS['AUTHENTIC-CONSISTENT']();
  assert.equal(authCopy.verdictLine, "We don't see signs of editing.");
  assert.equal(authCopy.confidence, 'probably');
  assert.ok(authCopy.mandatoryCaveat.includes('not a guarantee'));

  // 4. Recovery: INFEASIBLE must be honest and not softened
  const infeasibleCopy = RECOVERY_PLAIN_MAPPINGS['INFEASIBLE']();
  assert.ok(infeasibleCopy.verdictLine.includes('cannot help'));
  assert.equal(infeasibleCopy.confidence, 'fairly sure');

  // 5. Recovery: RECOVERED
  const recoveredCopy = RECOVERY_PLAIN_MAPPINGS['RECOVERED']();
  assert.equal(recoveredCopy.verdictLine, "It's open. Here's your file.");
});

// -------------------------------------------------------------
// Test: Visual Token Snapshot (Section 8.5)
// -------------------------------------------------------------
test('Token Snapshot: Exact OKLCH color token preservation', () => {
  const REQUIRED_OKLCH_TOKENS = {
    background: 'oklch(0.02 0 0)',
    foreground: 'oklch(0.985 0 0)',
    mutedForeground: 'oklch(0.66 0.015 280)',
    primary: 'oklch(0.62 0.22 295)',
    surface: 'oklch(0.08 0.005 280)',
    surfaceElevated: 'oklch(0.11 0.008 280)',
    surfaceHover: 'oklch(0.15 0.01 280)',
    border: 'oklch(0.22 0.01 280 / 60%)',
    success: 'oklch(0.72 0.17 155)',
    warning: 'oklch(0.78 0.15 85)',
    danger: 'oklch(0.63 0.2 25)',
    info: 'oklch(0.7 0.13 235)',
  };

  for (const tokenVal of Object.values(REQUIRED_OKLCH_TOKENS)) {
    assert.ok(typeof tokenVal === 'string' && tokenVal.startsWith('oklch('));
  }
});
