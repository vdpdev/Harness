import { getModel } from './get-model.js';

export const transitionsFrom = (kind, status) => getModel(kind).transitions.filter((t) => t.from === status);
