import {formatAge} from '../discovery';
import type {ManagedPet,SiteSettings,Plan,Catalog} from '../catalog-types';
import {insertRecord,listRecords,getRecord} from './supabase-data';

export async function allPets():Promise<ManagedPet[]>{return (await listRecords<ManagedPet>('pets')).map(row=>row.data)}
export async function allPlans():Promise<Plan[]>{return (await listRecords<Plan>('plans')).map(row=>row.data)}
export async function settings():Promise<SiteSettings>{const row=await getRecord<SiteSettings>('settings','1');if(!row)throw new Error('Petzo site settings are missing from Supabase. Run the Petzo data migration.');return row.data}
export async function audit(action:string){const created_at=new Date().toISOString();await insertRecord('audit',{action,created_at})}
export async function publicCatalog():Promise<Catalog>{
 const [pets,site,plans]=await Promise.all([allPets(),settings(),allPlans()]);
 return {pets:pets.filter(p=>p.status==='approved'&&p.availability).map(({ownerName,ownerEmail,status,updatedAt,discoveryPreferences,...p})=>({...p,age:formatAge(p.age)})),settings:site,plans:plans.filter(p=>p.active),updatedAt:new Date().toISOString()};
}
