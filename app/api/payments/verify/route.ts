import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {localEnabled,validOrigin} from '../../../../lib/server/admin-auth';
import {fetchRazorpayPayment,verifyCheckoutSignature} from '../../../../lib/server/razorpay';
import {fulfillRazorpayPayment,hashPaymentToken,type PaymentRecord} from '../../../../lib/server/payment-fulfillment';
import {getRecord} from '../../../../lib/server/supabase-data';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({razorpay_order_id:z.string().min(8).max(80),razorpay_payment_id:z.string().min(8).max(80),razorpay_signature:z.string().regex(/^[a-f0-9]{64}$/i),accessToken:z.string().regex(/^[A-Za-z0-9_-]{40,60}$/)}).strict();

export async function POST(request:NextRequest){
 if(!localEnabled())return NextResponse.json({error:'Database is not configured.'},{status:503});
 if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Invalid Razorpay payment response.'},{status:400});
 const {razorpay_order_id:orderId,razorpay_payment_id:paymentId,razorpay_signature:signature,accessToken}=parsed.data;
 try{
  const row=await getRecord<PaymentRecord>('razorpay_payments',orderId);
  if(!row||row.owner_token_hash!==hashPaymentToken(accessToken))return NextResponse.json({error:'Payment order does not match this browser session.'},{status:403});
  if(!verifyCheckoutSignature(orderId,paymentId,signature))return NextResponse.json({error:'Razorpay payment signature is invalid.'},{status:400});
  const payment=await fetchRazorpayPayment(paymentId);
  if(payment.order_id!==orderId||payment.amount!==row.data.amount*100||payment.currency!=='INR')return NextResponse.json({error:'The payment does not match the expected Petzo order.'},{status:400});
  if(payment.status!=='captured'||!payment.captured)return NextResponse.json({status:'processing',message:'Payment received; waiting for Razorpay capture confirmation.'},{status:202,headers:{'Cache-Control':'no-store'}});
  const entitlement=await fulfillRazorpayPayment(orderId,paymentId);
  return NextResponse.json({status:'paid',planName:entitlement.planName,expiresAt:entitlement.expiresAt},{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const message=error instanceof Error?error.message:'';
  const status=message==='RAZORPAY_NOT_CONFIGURED'?503:502;
  return NextResponse.json({error:status===503?'Razorpay is not configured yet.':'We could not verify this payment with Razorpay. It may still be confirmed by webhook; refresh shortly.'},{status,headers:{'Cache-Control':'no-store'}});
 }
}
