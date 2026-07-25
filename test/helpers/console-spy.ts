export type ConsoleWarnSpy = {
  calls: unknown[][];
  restore: () => void;
};

export const spyOnWarn = (): ConsoleWarnSpy => {
  const original = console.warn;
  const calls: unknown[][] = [];
  console.warn = (...args: unknown[]): void => {
    calls.push(args);
  };
  return {
    calls,
    restore: () => {
      console.warn = original;
    },
  };
};

export const withWarnSpy = <T>(fn: (spy: ConsoleWarnSpy) => T): T => {
  const spy = spyOnWarn();
  try {
    return fn(spy);
  } finally {
    spy.restore();
  }
};
