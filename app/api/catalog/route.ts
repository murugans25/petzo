import {NextResponse} from 'next/server';
import {publicCatalog} from '../../../lib/server/database';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(){try{return NextResponse.json(publicCatalog(),{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Catalog is unavailable. Configure the local database.'},{status:503,headers:{'Cache-Control':'no-store'}})}}
