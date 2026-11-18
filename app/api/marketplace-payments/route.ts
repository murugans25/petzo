import {NextResponse} from 'next/server';

export const dynamic='force-dynamic';
const retired=()=>NextResponse.json({error:'Manual ?99 marketplace UPI payments are retired. Use the current Razorpay seller or buyer plans.'},{status:410,headers:{'Cache-Control':'no-store'}});
export async function GET(){return retired()}
export async function POST(){return retired()}
