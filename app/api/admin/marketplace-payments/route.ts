import {NextRequest,NextResponse} from 'next/server';
import {guard} from '../../../../lib/server/admin-auth';

export const dynamic='force-dynamic';
export async function GET(request:NextRequest){const blocked=await guard(request);if(blocked)return blocked;return NextResponse.json({requests:[],message:'Manual UPI approvals are retired. Razorpay payments activate automatically.'},{headers:{'Cache-Control':'no-store'}})}
export async function PATCH(request:NextRequest){const blocked=await guard(request);if(blocked)return blocked;return NextResponse.json({error:'Manual UPI approvals are retired. Razorpay payments activate automatically.'},{status:410})}
