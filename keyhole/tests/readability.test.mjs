import test from 'node:test';
import assert from 'node:assert/strict';
import { runFullReadabilityAudit } from '../scripts/readability-lint.mjs';

test('Readability Gate: All Simple mode strings <= 18 words and Grade <= 8.0', () => {
  const reports = runFullReadabilityAudit();
  assert.ok(reports.length >= 50, 'Should audit at least 50 user-facing strings');

  const failures = reports.filter((r) => !r.passed);
  if (failures.length > 0) {
    const msgs = failures.map((f) => `[${f.label}]: ${f.errors.join('; ')}`).join('\n');
    assert.fail(`Readability gate failed for ${failures.length} strings:\n${msgs}`);
  }

  const avgGrade = reports.reduce((acc, r) => acc + r.grade, 0) / reports.length;
  assert.ok(avgGrade <= 8.0, `Average grade ${avgGrade} must be <= 8.0`);
});
