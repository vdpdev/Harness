import * as fs from 'node:fs';
import * as path from 'node:path';

const failures: string[] = [];

const skillsDir = path.resolve('.agents', 'skills');
const agentsMdPath = path.resolve('AGENTS.md');
const customPath = path.resolve('.agents-custom.md');

const agentsMd = fs.readFileSync(agentsMdPath, 'utf8');
const agentsCustom = fs.existsSync(customPath) ? fs.readFileSync(customPath, 'utf8') : '';
const combined = agentsMd + '\n' + agentsCustom;

if (!fs.existsSync(skillsDir)) {
  console.log('✗ .agents/skills/ directory not found');
  failures.push('.agents/skills/ directory not found');
} else {
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillDir = entry.name;
    const skillFile = path.join('.agents', 'skills', skillDir, 'SKILL.md');
    if (!fs.existsSync(path.resolve(skillFile))) continue;

    const skillRef = `- **\`${skillDir}\`**`;
    if (combined.includes(skillRef)) {
      console.log(`✓ ${skillDir}: registered in AGENTS.md or .agents-custom.md`);
    } else {
      console.log(`✗ ${skillDir}: NOT registered (expected: ${skillRef} in AGENTS.md or .agents-custom.md)`);
      failures.push(`${skillDir}: not registered in AGENTS.md or .agents-custom.md`);
    }
  }

  if (failures.length === 0) {
    console.log(`\n✓ All skills registered`);
  }
}

if (failures.length > 0) {
  console.log(`\n✗ ${failures.length} skill(s) missing from AGENTS.md:`);
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  process.exit(1);
}
