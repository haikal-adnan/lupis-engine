import { randomBytes } from 'crypto';

// Fungsi generate ID dengan Prefix (contoh: 'proj_xxxx', 'scene_xxxx')
export const generateId = (prefix = 'id') => {
  // Generate random string 10 karakter
  const randomStr = randomBytes(5).toString('hex');
  return `${prefix}_${randomStr}`;
};