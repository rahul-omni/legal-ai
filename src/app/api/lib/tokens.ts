import crypto from 'crypto';
import { addHours } from 'date-fns';

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function getTokenExpiry() {
  return addHours(new Date(), 24); // Token expires in 24 hours
}