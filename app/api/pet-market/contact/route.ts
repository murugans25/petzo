import {NextRequest,NextResponse} from 'next/server';
import {localEnabled,validOrigin} from '../../../../lib/server/admin-auth';
import {hashPaymentToken} from '../../../../lib/server/payment-fulfillment';
import {getRecordById,listRecords,updateRecord} from '../../../../lib/server/supabase-data';
import type {PetMarketListing} from '../../../../lib/pet-market-types';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
 if(!localEnabled())return NextResponse.json({error:'Buyer contact is unavailable.'},{status:503});
 if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const body=await request.json().catch(()=>null) as {accessToken?:string;listingId?:number}|null;
 if(!body||typeof body.accessToken!=='string'||!/^[A-Za-z0-9_-]{40,60}$/.test(body.accessToken)||!Number.isSafeInteger(body.listingId))return NextResponse.json({error:'Invalid buyer access or listing.'},{status:400});
 try{
  const ownerTokenHash=hashPaymentToken(body.accessToken);
  const entitlements=await listRecords<Record<string,unknown>>('purchase_entitlements',{ownerTokenHash,ascending:false});
  const entitlement=entitlements.find(row=>row.data.kind==='buyer_contacts'&&row.data.status==='active'&&typeof row.data.expiresAt==='string'&&Date.parse(String(row.data.expiresAt))>Date.now()&&Number(row.data.contactsUsed||0)<Number(row.data.contactLimit||8));
  if(!entitlement)return NextResponse.json({error:'An active Buyer plan with contacts remaining is required. Choose the ₹299 plan for up to 8 seller contacts.'},{status:403});
  const listing=(await getRecordById<PetMarketListing>('pet_market_listings',Number(body.listingId)))?.data;
  if(!listing||listing.status!=='approved')return NextResponse.json({error:'This pet listing is not available.'},{status:404});
  const unlocked=Array.isArray(entitlement.data.unlockedListingIds)?entitlement.data.unlockedListingIds.map(Number):[];
  if(!unlocked.includes(listing.id)){
   const used=Number(entitlement.data.contactsUsed||0);const limit=Number(entitlement.data.contactLimit||8);
   if(used>=limit)return NextResponse.json({error:'You have used all contacts included in this plan.'},{status:403});
   const next={...entitlement.data,contactsUsed:used+1,unlockedListingIds:[...unlocked,listing.id]};
   if(!await updateRecord(entitlement.row_id,next,{ownerTokenHash}))return NextResponse.json({error:'Could not reserve this contact. Please try again.'},{status:409});
  }
  return NextResponse.json({contactsUsed:Number(entitlement.data.contactsUsed||0)+(unlocked.includes(listing.id)?0:1),contactLimit:Number(entitlement.data.contactLimit||8),seller:{name:listing.sellerName,phone:listing.sellerPhone,email:listing.sellerEmail,location:listing.location},petName:listing.petName},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Unable to unlock seller contact.'},{status:503})}
}
