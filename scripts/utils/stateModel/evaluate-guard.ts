export const evaluateGuard = (guard, item, ctx) => {
  if (guard === 'blockersResolved') {
    const blockers = item?.blockedBy ?? [];
    const unresolved = blockers.filter((b) => !ctx.isDone(b));
    if (unresolved.length) {
      return `blocked by unresolved ${unresolved.join(', ')}`;
    }
    return null;
  }
  return null;
};
