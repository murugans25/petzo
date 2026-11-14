import type {Pet} from './data';
// Discovery suggestions only: no medical, genetic or breeding-eligibility inference.
export function suggestedMates<T extends Pet>(own:T,list:T[]):T[]{return list.filter(p=>p.id!==own.id&&p.type===own.type&&p.breed.toLowerCase()===own.breed.toLowerCase()&&p.gender!==own.gender)}

