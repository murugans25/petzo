import {NextRequest,NextResponse} from 'next/server';
import {localEnabled} from '../../../../lib/server/admin-auth';
import {verifyWebhookSignature} from '../../../../lib/server/razorpay';
import {fulfillRazorpayPayment} from '../../../../lib/server/payment-fulfillment';
import {getRecord,putRecord} from '../../../../lib/server/supabase-data';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:NextRequest){
 if(!localEnabled())return NextResponse.json({error:'Database is not configured.'},{status:503});
 const rawBody=await request.text();
 const signature=request.headers.get('x-razorpay-signature')||'';
 if(!verifyWebhookSignature(rawBody,signature))return NextResponse.json({error:'Invalid Razorpay webhook signature.'},{status:400});
 try{
  const body=JSON.parse(rawBody) as {event?:string;payload?:{payment?:{entity?:{id?:string;order_id?:string;status?:string}}}};
  const eventId=request.headers.get('x-razorpay-event-id')||'';
  if(eventId){const seen=await getRecord('razorpay_webhook_events',eventId);if(seen)return NextResponse.json({received:true,duplicate:true})}
  const entity=body.payload?.payment?.entity;
  if((body.event==='payment.captured'||body.event==='order.paid')&&entity?.id&&entity.order_id&&entity.status==='captured'){
   await fulfillRazorpayPayment(entity.order_id,entity.id);
  }
  if(eventId)await putRecord('razorpay_webhook_events',eventId,{event:body.event||'unknown',receivedAt:new Date().toISOString()});
  return NextResponse.json({received:true});
 }catch{
  return NextResponse.json({error:'Could not process this Razorpay webhook.'},{status:500});
 }
}
