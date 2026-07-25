import { getModel } from './get-model.js';
import { transitionsFrom } from './transitions-from.js';
import { evaluateGuard } from './evaluate-guard.js';

export const formatStateTransitions = (kind, status, item, ctx) => {
  const model = getModel(kind);
  const lines = [];
  lines.push(`${model.kind} state transitions`);
  lines.push(`  current state: ${status}`);
  if (kind === 'ticket' && item?.blockedBy?.length) {
    lines.push(`  blockedBy:     ${item.blockedBy.join(', ')}`);
  }
  lines.push('');
  lines.push('  allowed next states:');

  const transitions = transitionsFrom(kind, status);
  if (!transitions.length) {
    lines.push('    (none — terminal state)');
    return lines.join('\n');
  }

  for (const t of transitions) {
    let note = '';
    if (t.guard) {
      const guardReason = evaluateGuard(t.guard, item, ctx);
      note = guardReason ? `  [BLOCKED: ${guardReason}]` : '  [guard: blockersResolved OK]';
    }
    lines.push(`    ${status} --${t.command}--> ${t.to}${note}`);
  }

  if (model.verdicts.length) {
    lines.push('');
    lines.push(`  verdict subspace: ${model.verdicts.join(' | ')}`);
  }
  return lines.join('\n');
};
