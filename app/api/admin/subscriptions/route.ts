import {NextRequest,NextResponse} from 'next/server';
import {guard} from '../../../../lib/server/admin-auth';
import {listRecords} from '../../../../lib/server/supabase-data';

export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const blocked=await guard(request);if(blocked)return blocked;
 try{const rows=await listRecords<Record<string,unknown>>('subscription_requests',{ascending:false});return NextResponse.json({requests:rows.map(row=>({...row.data,id:row.row_id,createdAt:row.data.createdAt||row.created_at}))},{headers:{'Cache-Control':'no-store'}})}
 catch{return NextResponse.json({error:'Unable to load subscription requests.'},{status:503})}
}
export async function PATCH(request:NextRequest){
 const blocked=await guard(request);if(blocked)return blocked;
 return NextResponse.json({error:'Manual UPI approvals are retired. Successful Razorpay payments activate automatically.'},{status:410});
}
