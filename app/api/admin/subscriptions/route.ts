import {NextRequest,NextResponse} from 'next/server';
import {guard} from '../../../../lib/server/admin-auth';
import {audit} from '../../../../lib/server/database';
import {listRecords,updateRecord} from '../../../../lib/server/supabase-data';

export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const blocked=await guard(request);if(blocked)return blocked;
 try{const rows=await listRecords<Record<string,unknown>>('subscription_requests',{ascending:false});return NextResponse.json({requests:rows.map(row=>({...row.data,id:row.row_id,createdAt:row.data.createdAt||row.created_at}))},{headers:{'Cache-Control':'no-store'}})}
 catch{return NextResponse.json({error:'Unable to load subscription requests.'},{status:503})}
}
export async function PATCH(request:NextRequest){
 const blocked=await guard(request);if(blocked)return blocked;
 try{
  const body=await request.json() as {id?:number;status?:string;reviewNote?:string};
  if(!Number.isSafeInteger(body.id)||!['approved','declined'].includes(body.status||''))return NextResponse.json({error:'Choose a valid subscription request and decision.'},{status:400});
  const rows=await listRecords<Record<string,unknown>>('subscription_requests');
  const row=rows.find(item=>item.row_id===body.id);if(!row)return NextResponse.json({error:'Subscription request not found.'},{status:404});
  if(row.data.status!=='pending')return NextResponse.json({error:'This request has already been reviewed.'},{status:409});
  const reviewNote=(body.reviewNote||'').trim().slice(0,300);
  const expiry=new Date();if(body.status==='approved')expiry.setMonth(expiry.getMonth()+1);
  const expiresAt=body.status==='approved'?expiry.toISOString():null;
  const data={...row.data,status:body.status,reviewNote,reviewedAt:new Date().toISOString(),expiresAt,updatedAt:new Date().toISOString()};
  if(!await updateRecord(row.row_id,data))return NextResponse.json({error:'Request changed; refresh and try again.'},{status:409});
  await audit(`Premium payment request #${row.row_id} ${body.status}`);
  return NextResponse.json({request:{id:row.row_id,status:body.status,expiresAt,reviewNote}});
 }catch{return NextResponse.json({error:'Unable to review this subscription request.'},{status:503})}
}
