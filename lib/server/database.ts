import {formatAge} from '../discovery';
import type {ManagedPet,SiteSettings,Plan,Catalog} from '../catalog-types';
import {insertRecord,listRecords,getRecord} from './supabase-data';

export async function allPets():Promise<ManagedPet[]>{return (await listRecords<ManagedPet>('pets')).map(row=>row.data)}
export async function allPlans():Promise<Plan[]>{return (await listRecords<Plan>('plans')).map(row=>row.data)}
export const DEFAULT_SITE_SETTINGS:SiteSettings={announcement:'A thoughtful start for every pet connection.',heroTitle:'Their perfect match.',heroAccent:'Your next happy story.',heroDescription:'Meet compatible pets and caring pet parents, just around the corner.',contactEmail:''};
export function emptyCatalog(error?:string,diagnostic?:string):Catalog{return {pets:[],settings:DEFAULT_SITE_SETTINGS,plans:[],updatedAt:new Date().toISOString(),...(error?{error}:{}),...(diagnostic?{diagnostic}:{})}}
export async function settings():Promise<SiteSettings>{const row=await getRecord<SiteSettings>('settings','1');return row?.data??DEFAULT_SITE_SETTINGS}
export async function audit(action:string){const created_at=new Date().toISOString();await insertRecord('audit',{action,created_at})}
export async function publicCatalog():Promise<Catalog>{
 const [pets,site,plans]=await Promise.all([allPets(),settings(),allPlans()]);
 return {pets:pets.filter(p=>p.status==='approved'&&p.availability).map(({ownerName,ownerEmail,status,updatedAt,discoveryPreferences,...p})=>({...p,age:formatAge(p.age)})),settings:site,plans:plans.filter(p=>p.active),updatedAt:new Date().toISOString()};
}
