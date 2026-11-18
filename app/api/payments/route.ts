import {NextRequest,NextResponse} from 'next/server';
import {localEnabled} from '../../../lib/server/admin-auth';
import {hashPaymentToken,type PaymentRecord} from '../../../lib/server/payment-fulfillment';
import {listRecords} from '../../../lib/server/supabase-data';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 if(!localEnabled())return NextResponse.json({error:'Payment status is unavailable.'},{status:503});
 const token=request.nextUrl.searchParams.get('token')||'';
 if(!/^[A-Za-z0-9_-]{40,60}$/.test(token))return NextResponse.json({error:'Invalid payment access token.'},{status:400});
 try{
  const ownerTokenHash=hashPaymentToken(token);
  const [rows,entitlements]=await Promise.all([listRecords<PaymentRecord>('razorpay_payments',{ownerTokenHash,ascending:false}),listRecords<Record<string,unknown>>('purchase_entitlements',{ownerTokenHash,ascending:false})]);
  const byOrder=new Map(entitlements.map(row=>[String(row.data.orderId),row.data]));
  return NextResponse.json({payments:rows.map(row=>{const entitlement=byOrder.get(row.data.orderId);return {orderId:row.data.orderId,planId:row.data.planId,planName:row.data.planName,amount:row.data.amount,status:row.data.status,expiresAt:row.data.expiresAt||null,contactLimit:Number(entitlement?.contactLimit||row.data.contactLimit||0),contactsUsed:Number(entitlement?.contactsUsed||0),profileLimit:Number(entitlement?.profileLimit||row.data.profileLimit||0),profilesUsed:Number(entitlement?.profilesUsed||0)}})},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Unable to load payment status.'},{status:503})}
}
