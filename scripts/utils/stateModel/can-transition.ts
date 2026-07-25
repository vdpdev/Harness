import { getModel } from './get-model.js';
import { evaluateGuard } from './evaluate-guard.js';

export const canTransition = (kind, status, command, item, ctx) => {
  const transition = getModel(kind).transitions.find((t) => t.from === status && t.command === command);
  if (!transition) {
    return { allowed: false, reason: `no ${command} transition from "${status}"`, transition: null };
  }
  if (transition.guard) {
    const guardReason = evaluateGuard(transition.guard, item, ctx);
    if (guardReason) {
      return { allowed: false, reason: guardReason, transition: null };
    }
  }
  return { allowed: true, reason: null, transition };
};
