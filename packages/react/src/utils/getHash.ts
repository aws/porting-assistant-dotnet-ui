import { createHash } from 'crypto';

export const getHash = (str: string) => {
  return createHash('sha256').update(str).digest('hex');
}