import {NextRequest,NextResponse} from 'next/server';
import {guard} from '../../../../../../lib/server/admin-auth';
import {listRecords} from '../../../../../../lib/server/supabase-data';
import {readPrivateMarketDocument} from '../../../../../../lib/server/private-market-documents';
import type {PetMarketListing} from '../../../../../../lib/pet-market-types';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest,{params}:{params:Promise<{key:string}>}){const denied=await guard(request);if(denied)return denied;try{const {key}=await params;const rows=await listRecords<PetMarketListing>('pet_market_listings');let document:PetMarketListing['registrationDocument']|PetMarketListing['vetDocument']=null;for(const row of rows){document=[row.data.registrationDocument,row.data.vetDocument].find(item=>item?.key===key)||null;if(document)break}if(!document)return NextResponse.json({error:'Private seller document not found.'},{status:404});const bytes=await readPrivateMarketDocument(key);if(!bytes)return NextResponse.json({error:'Private seller document is unavailable.'},{status:404});return new NextResponse(bytes,{headers:{'Content-Type':document.type,'Content-Length':String(bytes.byteLength),'Content-Disposition':`attachment; filename="${encodeURIComponent(document.name)}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}catch{return NextResponse.json({error:'Could not read the seller document.'},{status:500})}}
