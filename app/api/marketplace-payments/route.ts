import {createHash,randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit} from '../../../lib/server/database';
import {localEnabled,validOrigin} from '../../../lib/server/admin-auth';
import {hashOwnerToken} from '../../../lib/server/adoption-access';
import {getRecordById,insertRecord,listRecords} from '../../../lib/server/supabase-data';
import type {PetMarketListing} from '../../../lib/pet-market-types';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
const schema=z.object({kind:z.enum(['listing_fee','contact_fee']),listingId:z.number().int().positive(),name:z.string().trim().min(2).max(100),email:z.string().trim().email().max(200),phone:z.string().trim().min(7).max(30),location:z.string().trim().min(2).max(100),utr:z.string().trim().min(6).max(32).regex(/^[a-zA-Z0-9-]+$/),amount:z.literal(99),ownerToken:z.string().min(32).max(128).optional()}).strict();
const fail=(error:string,status=400)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});

export async function POST(request:NextRequest){
 if(!localEnabled()||!validOrigin(request))return fail('Marketplace payments are unavailable.',403);
 const parsed=schema.safeParse(await request.json());if(!parsed.success)return fail(parsed.error.issues.map(i=>i.message).join('; '));
 try{
  const {kind,listingId,ownerToken,...buyer}=parsed.data;
  const listing=await getRecordById<PetMarketListing>('pet_market_listings',listingId);
  if(!listing)return fail('This pet listing was not found.',404);
  if(kind==='listing_fee'&&(listing.data.status!=='pending_payment'||!ownerToken||listing.owner_token_hash!==hashOwnerToken(ownerToken)))return fail('The seller listing payment link is invalid or already used.',403);
  if(kind==='contact_fee'&&listing.data.status!=='approved')return fail('This pet is not available to contact.',404);
  const since=Date.now()-60*60*1000;
  const recent=(await listRecords<Record<string,unknown>>('marketplace_payments')).filter(r=>Date.parse(String(r.data.createdAt||r.created_at))>since).length;
  if(recent>=60)return fail('Too many payment submissions. Try again later.',429);
  const accessToken=randomBytes(32).toString('base64url'),now=new Date().toISOString();
  const data={...buyer,kind,listingId,amount:99,currency:'INR',provider:'manual-upi',status:'pending',utr:parsed.data.utr,createdAt:now,updatedAt:now,reviewNote:''};
  const id=await insertRecord('marketplace_payments',data,{ownerTokenHash:tokenHash(accessToken),listingId,createdAt:now,updatedAt:now});
  await audit(`Marketplace ₹99 ${kind} submitted for listing #${listingId}, payment request #${id}`);
  return NextResponse.json({id,status:'pending',accessToken,message:'Payment reference submitted. Access is enabled after Petzo verifies the ₹99 UPI credit.'},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Could not save this payment request. Please try again.',503)}
}

export async function GET(request:NextRequest){
 const token=request.nextUrl.searchParams.get('token')||'';if(!/^[A-Za-z0-9_-]{40,60}$/.test(token))return fail('Invalid payment status link.');
 try{const rows=await listRecords<Record<string,unknown>>('marketplace_payments',{ownerTokenHash:tokenHash(token)});const requestRow=rows[0];if(!requestRow)return fail('Payment request not found.',404);const data=requestRow.data;let seller:Record<string,string>|null=null;
  if(data.status==='approved'&&data.kind==='contact_fee'){const listing=await getRecordById<PetMarketListing>('pet_market_listings',Number(data.listingId));if(listing)seller={name:listing.data.sellerName,email:listing.data.sellerEmail,phone:listing.data.sellerPhone,location:listing.data.location};}
  return NextResponse.json({id:requestRow.row_id,kind:data.kind,listingId:Number(data.listingId),status:data.status,amount:data.amount,reviewNote:data.reviewNote||'',seller},{headers:{'Cache-Control':'no-store'}})
 }catch{return fail('Unable to load payment status.',503)}
}
