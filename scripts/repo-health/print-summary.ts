import type { HealthCheckResult } from './types.js';

export const printSummary = (results: HealthCheckResult[]): void => {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  REPO HEALTH SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`  ${icon} ${r.name}`);
    if (!r.ok && r.detail) {
      for (const line of r.detail.split('\n')) {
        console.log(`    ${line}`);
      }
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n  ${passed}/${results.length} checks passed${failed > 0 ? `, ${failed} FAILED` : ''}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
};
