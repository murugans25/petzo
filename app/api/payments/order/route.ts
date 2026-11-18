import {randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {localEnabled,validOrigin} from '../../../../lib/server/admin-auth';
import {createRazorpayOrder,PETZO_PLANS} from '../../../../lib/server/razorpay';
import {insertRecord} from '../../../../lib/server/supabase-data';
import {hashPaymentToken,type PaymentRecord} from '../../../../lib/server/payment-fulfillment';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({planId:z.enum(['pairing_monthly','buyer_contacts','seller_individual','seller_breeder']),name:z.string().trim().min(2).max(100),email:z.string().trim().email().max(200),phone:z.string().trim().min(7).max(24),petName:z.string().trim().min(2).max(80).optional(),accessToken:z.string().regex(/^[A-Za-z0-9_-]{40,60}$/).optional()}).strict();

export async function POST(request:NextRequest){
 if(!localEnabled())return NextResponse.json({error:'Database is not configured.'},{status:503});
 if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(issue=>issue.message).join('; ')},{status:400});
 const plan=PETZO_PLANS[parsed.data.planId];
 const accessToken=parsed.data.accessToken||randomBytes(32).toString('base64url');
 const ownerTokenHash=hashPaymentToken(accessToken);
 const createdAt=new Date().toISOString();
 const receipt=`pz_${Date.now()}_${randomBytes(4).toString('hex')}`;
 try{
  const {order,config}=await createRazorpayOrder({planId:parsed.data.planId,receipt,notes:{product:'Petzo',planId:parsed.data.planId,customerEmail:parsed.data.email,...(parsed.data.petName?{petName:parsed.data.petName}:{})}});
  const data:PaymentRecord={orderId:order.id,planId:parsed.data.planId,planName:plan.name,kind:plan.kind,amount:plan.amount,currency:'INR',status:'created',createdAt,contactLimit:'contactLimit'in plan?plan.contactLimit:undefined,profileLimit:'profileLimit'in plan?plan.profileLimit:undefined,customer:{name:parsed.data.name,email:parsed.data.email,phone:parsed.data.phone}};
  await insertRecord('razorpay_payments',data as unknown as Record<string,unknown>,{recordKey:order.id,ownerTokenHash,createdAt});
  return NextResponse.json({orderId:order.id,amount:order.amount,currency:order.currency,keyId:config.publicKey,planName:plan.name,accessToken},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const message=error instanceof Error?error.message:'';
  const status=message==='RAZORPAY_NOT_CONFIGURED'?503:502;
  return NextResponse.json({error:status===503?'Razorpay is not configured yet. Add the Razorpay environment variables and redeploy.':'Could not create a secure Razorpay order. Please try again.'},{status});
 }
}
