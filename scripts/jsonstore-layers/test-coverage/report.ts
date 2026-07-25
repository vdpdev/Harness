import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { readAll } from './read-all.js';

export const report = () => {
  const data = { entries: readAll() };
  const entries = data.entries ?? [];
  const total = entries.length;
  if (!total) {
    console.log('No test entries. Run: node scripts/test-coverage.ts init');
    return;
  }

  const sword = entries.filter((e) => e.classification === 'sword');
  const shield = entries.filter((e) => e.classification === 'shield');
  const scored = entries.filter((e) => e.strength != null);

  const buckets = { '0-39 (weak)': 0, '40-69 (fair)': 0, '70-89 (good)': 0, '90-100 (strong)': 0 };
  for (const e of scored) {
    const s = e.strength;
    if (s < 40) buckets['0-39 (weak)'] += 1;
    else if (s < 70) buckets['40-69 (fair)'] += 1;
    else if (s < 90) buckets['70-89 (good)'] += 1;
    else buckets['90-100 (strong)'] += 1;
  }

  const weaknessCounts = {};
  for (const e of entries) {
    const findings = e.findings ? String(e.findings).split('\n') : [];
    for (const f of findings) {
      const line = f.trim();
      if (!line) continue;
      const key = line.split(/[—:]/)[0].trim().toLowerCase();
      weaknessCounts[key] = (weaknessCounts[key] ?? 0) + 1;
    }
  }

  const avg = (arr) =>
    arr.length ? Math.round((arr.reduce((a, e) => a + (e.strength ?? 0), 0) / arr.length) * 10) / 10 : null;

  console.log('Test-duel coverage report');
  console.log(`  files:            ${total}`);
  console.log(`  sword (product):  ${sword.length}`);
  console.log(`  shield (quality): ${shield.length}`);
  if (sword.length && shield.length) {
    const ratio = (sword.length / shield.length).toFixed(2);
    console.log(`  sword:shield ratio: ${ratio}`);
  }

  console.log('\n  strength distribution (scored files: ' + scored.length + '):');
  for (const [label, count] of Object.entries(buckets)) {
    console.log(`    ${label.padEnd(16)} ${count}`);
  }
  const avgAll = avg(scored);
  const avgSword = avg(sword.filter((e) => e.strength != null));
  const avgShield = avg(shield.filter((e) => e.strength != null));
  if (avgAll != null) {
    console.log(`\n  avg strength: ${avgAll}  (sword ${avgSword ?? 'n/a'}, shield ${avgShield ?? 'n/a'})`);
  }

  const weaknessEntries = Object.entries(weaknessCounts).sort((a, b) => b[1] - a[1]);
  if (weaknessEntries.length) {
    console.log('\n  weakness tally:');
    for (const [w, c] of weaknessEntries) console.log(`    ${c}x  ${w}`);
  } else {
    console.log('\n  weakness tally: (none recorded)');
  }

  const weakest = [...entries]
    .filter((e) => e.strength != null)
    .sort((a, b) => a.strength - b.strength)
    .slice(0, 10);
  if (weakest.length) {
    console.log('\n  weakest files (top 10):');
    for (const e of weakest) console.log(`    ${String(e.strength).padStart(3)}/100  ${e.id} (${e.classification})`);
  }
};
