import {createHash,randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit} from '../../../lib/server/database';
import {localEnabled,validOrigin} from '../../../lib/server/admin-auth';
import {insertRecord,listRecords} from '../../../lib/server/supabase-data';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const PRICE_INR=399;
const requestSchema=z.object({name:z.string().trim().min(2).max(100),email:z.string().trim().email().max(200),phone:z.string().trim().min(7).max(24),petName:z.string().trim().min(2).max(80),utr:z.string().trim().min(6).max(32).regex(/^[a-zA-Z0-9-]+$/,'Enter the UTR / transaction reference shown by your UPI app.'),amount:z.literal(PRICE_INR)}).strict();
const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');

export async function POST(request:NextRequest){
 if(!localEnabled())return NextResponse.json({error:'Subscription requests are not configured.'},{status:503});
 if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 try{
  const recent=(await listRecords<{createdAt:string}>('subscription_requests')).filter(row=>Date.now()-Date.parse(row.data.createdAt||row.created_at)<60*60*1000).length;
  if(recent>=30)return NextResponse.json({error:'Too many requests. Please try again later.'},{status:429});
  const parsed=requestSchema.safeParse(await request.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(issue=>issue.message).join('; ')},{status:400});
  const token=randomBytes(32).toString('base64url');
  const now=new Date().toISOString();
  const data={...parsed.data,amount:PRICE_INR,status:'pending',createdAt:now,updatedAt:now,currency:'INR',provider:'manual-upi',expiresAt:null,reviewNote:''};
  const id=await insertRecord('subscription_requests',data,{ownerTokenHash:tokenHash(token),createdAt:now,updatedAt:now});
  await audit(`Premium payment submitted for review #${id}`);
  return NextResponse.json({id,status:'pending',accessToken:token,message:'Payment request sent. Premium starts only after admin verifies the payment.'},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Could not save your payment request. Please try again.'},{status:503})}
}

export async function GET(request:NextRequest){
 if(!localEnabled())return NextResponse.json({error:'Subscription status is unavailable.'},{status:503});
 const token=request.nextUrl.searchParams.get('token')||'';
 if(!/^[A-Za-z0-9_-]{40,60}$/.test(token))return NextResponse.json({error:'Enter a valid payment request link.'},{status:400});
 try{
  const rows=await listRecords<Record<string,unknown>>('subscription_requests',{ownerTokenHash:tokenHash(token)});
  const record=rows[0]?.data;
  if(!record)return NextResponse.json({error:'Payment request not found.'},{status:404});
  return NextResponse.json({status:record.status,expiresAt:record.expiresAt||null,reviewNote:record.reviewNote||'',amount:record.amount},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Unable to load payment status.'},{status:503})}
}
