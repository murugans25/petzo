import {createHmac,timingSafeEqual} from 'node:crypto';

export const PETZO_PLANS={
 pairing_monthly:{name:'Pairing · one month',amount:399,kind:'pairing',durationDays:30},
 buyer_contacts:{name:'Buyer · 8 seller contacts',amount:299,kind:'buyer_contacts',durationDays:30,contactLimit:8},
 seller_individual:{name:'Individual seller · 8 pet profiles',amount:199,kind:'seller_profiles',durationDays:30,profileLimit:8},
 seller_breeder:{name:'Breeder · 15 pet profiles',amount:399,kind:'seller_profiles',durationDays:30,profileLimit:15},
} as const;
export type PetzoPlanId=keyof typeof PETZO_PLANS;

export function razorpayConfig(){
 const keyId=process.env.RAZORPAY_KEY_ID;
 const keySecret=process.env.RAZORPAY_KEY_SECRET;
 const publicKey=process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID||keyId;
 if(!keyId||!keySecret||!publicKey)throw new Error('RAZORPAY_NOT_CONFIGURED');
 return {keyId,keySecret,publicKey};
}

export async function createRazorpayOrder(input:{planId:PetzoPlanId;receipt:string;notes:Record<string,string>}){
 const config=razorpayConfig();
 const plan=PETZO_PLANS[input.planId];
 const response=await fetch('https://api.razorpay.com/v1/orders',{
  method:'POST',cache:'no-store',
  headers:{Authorization:`Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`,'Content-Type':'application/json'},
  body:JSON.stringify({amount:plan.amount*100,currency:'INR',receipt:input.receipt,notes:input.notes}),
 });
 if(!response.ok)throw new Error('RAZORPAY_ORDER_CREATE_FAILED');
 const order=await response.json() as {id:string;amount:number;currency:string;status:string};
 if(!order.id||order.amount!==plan.amount*100||order.currency!=='INR')throw new Error('RAZORPAY_ORDER_INVALID');
 return {order,config,plan};
}

export function verifyCheckoutSignature(orderId:string,paymentId:string,signature:string){
 const {keySecret}=razorpayConfig();
 const expected=createHmac('sha256',keySecret).update(`${orderId}|${paymentId}`).digest();
 let received:Buffer;
 try{received=Buffer.from(signature,'hex')}catch{return false}
 return received.length===expected.length&&timingSafeEqual(received,expected);
}

export function verifyWebhookSignature(rawBody:string,signature:string){
 const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
 if(!secret||!signature)return false;
 const expected=createHmac('sha256',secret).update(rawBody).digest();
 let received:Buffer;
 try{received=Buffer.from(signature,'hex')}catch{return false}
 return received.length===expected.length&&timingSafeEqual(received,expected);
}

export async function fetchRazorpayPayment(paymentId:string){
 const {keyId,keySecret}=razorpayConfig();
 const response=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,{
  headers:{Authorization:`Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`},cache:'no-store',
 });
 if(!response.ok)throw new Error('RAZORPAY_PAYMENT_LOOKUP_FAILED');
 return await response.json() as {id:string;order_id:string;status:string;amount:number;currency:string;captured:boolean};
}
