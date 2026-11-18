import {NextRequest,NextResponse} from 'next/server';
import {localEnabled,validOrigin} from '../../../lib/server/admin-auth';
import {getRecordById,listRecords} from '../../../lib/server/supabase-data';
import {hashPaymentToken} from '../../../lib/server/payment-fulfillment';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
 if(!localEnabled())return NextResponse.json({error:'Premium connections are not configured.'},{status:503});
 if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 try{
  const body=await request.json() as {token?:string;petId?:number};
  if(typeof body.token!=='string'||!/^[A-Za-z0-9_-]{40,60}$/.test(body.token)||!Number.isSafeInteger(body.petId)||Number(body.petId)<1)return NextResponse.json({error:'Invalid premium access or pet profile.'},{status:400});
  const tokenHash=hashPaymentToken(body.token);
  const purchases=await listRecords<Record<string,unknown>>('purchase_entitlements',{ownerTokenHash:tokenHash});
  const active=purchases.find(row=>['pairing','premium_breeding'].includes(String(row.data.kind))&&row.data.status==='active'&&typeof row.data.expiresAt==='string'&&Date.parse(String(row.data.expiresAt))>Date.now());
  if(!active)return NextResponse.json({error:'An active pairing plan is required to contact pet owners. Complete the secure ₹399 checkout to unlock this feature.'},{status:403});
  const pet=(await getRecordById<Record<string,unknown>>('pets',Number(body.petId)))?.data;
  if(!pet||pet.status!=='approved'||pet.availability===false)return NextResponse.json({error:'This pet profile is not available.'},{status:404});
  const email=typeof pet.ownerEmail==='string'?pet.ownerEmail.trim():'';
  const phone=typeof pet.ownerPhone==='string'?pet.ownerPhone.trim():'';
  if(!email&&!phone)return NextResponse.json({error:'The owner has not provided public contact details yet.'},{status:404});
  return NextResponse.json({ownerName:typeof pet.ownerName==='string'?pet.ownerName:'Pet owner',email,phone,petName:pet.name},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Unable to reveal owner contact details.'},{status:503})}
}
