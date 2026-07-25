import { commandOrder } from '../stateModel.js';

export const sortCommands = (cmds) =>
  [...new Set(cmds)].sort((a, b) => commandOrder.indexOf(a) - commandOrder.indexOf(b));
