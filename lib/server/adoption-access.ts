import {createHash,timingSafeEqual} from 'node:crypto';
export function hashOwnerToken(token:string){return createHash('sha256').update(token).digest('hex')}
export function tokenMatches(token:string,hash:string){if(!/^[a-f0-9]{64}$/.test(hash))return false;const actual=Buffer.from(hashOwnerToken(token),'hex');return actual.length===32&&timingSafeEqual(actual,Buffer.from(hash,'hex'))}
