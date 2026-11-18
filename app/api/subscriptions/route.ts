import {NextRequest,NextResponse} from 'next/server';
import {guard} from '../../../lib/server/admin-auth';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const retired=()=>NextResponse.json({error:'Manual UPI subscription requests are retired. Choose a current Petzo plan and pay securely through Razorpay.'},{status:410,headers:{'Cache-Control':'no-store'}});
export async function POST(){return retired()}
export async function GET(request:NextRequest){const blocked=await guard(request);if(blocked)return blocked;return NextResponse.json({requests:[],message:'Manual UPI payment approvals are retired. Razorpay payments activate automatically.'},{headers:{'Cache-Control':'no-store'}})}
export async function PATCH(request:NextRequest){const blocked=await guard(request);if(blocked)return blocked;return retired()}
