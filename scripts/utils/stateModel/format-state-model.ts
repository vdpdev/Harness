import { MODELS } from '../stateModel.js';
import { getModel } from './get-model.js';

export const formatStateModel = () => {
  const lines = [];
  for (const kind of Object.keys(MODELS)) {
    const model = getModel(kind);
    lines.push(`${model.kind} state machine`);
    lines.push(`  states: ${model.states.join(' | ')}`);
    if (model.verdicts.length) lines.push(`  verdict subspace: ${model.verdicts.join(' | ')}`);
    lines.push('  transitions:');
    for (const t of model.transitions) {
      const guard = t.guard ? `  [guard: ${t.guard}]` : '';
      lines.push(`    ${t.from} --${t.command}--> ${t.to}${guard}`);
    }
    lines.push('');
  }
  lines.push('guards:');
  lines.push('  blockersResolved — every id in item.blockedBy must already be in the done store');
  return lines.join('\n').trimEnd();
};
