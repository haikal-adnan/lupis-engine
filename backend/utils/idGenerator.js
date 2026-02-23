import { randomBytes } from 'crypto';

export const generateId = (prefix = 'id') => {
  const randomStr = randomBytes(5).toString('hex');
  return `${prefix}_${randomStr}`;
};