import {NextResponse} from 'next/server';
import {publicCatalog} from '../../../lib/server/database';
import {demoCatalog} from '../../../lib/server/demo-catalog';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(){try{return NextResponse.json(await publicCatalog(),{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({...demoCatalog(),preview:true},{headers:{'Cache-Control':'no-store'}})}}
