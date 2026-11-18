import {createHash} from 'node:crypto';
import {audit} from './database';
import {getRecord,updateRecord,putRecord} from './supabase-data';

export const hashPaymentToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export type PaymentRecord={orderId:string;paymentId?:string;planId:string;planName:string;kind:string;amount:number;currency:'INR';status:'created'|'paid'|'failed';createdAt:string;paidAt?:string;expiresAt?:string;contactLimit?:number;profileLimit?:number;customer:{name:string;email:string;phone:string}};

export async function fulfillRazorpayPayment(orderId:string,paymentId:string){
 const row=await getRecord<PaymentRecord>('razorpay_payments',orderId);
 if(!row)throw new Error('PAYMENT_ORDER_NOT_FOUND');
 const currentEntitlement=await getRecord('purchase_entitlements',orderId);
 if(row.data.status==='paid'&&currentEntitlement)return row.data;
 const now=new Date(row.data.paidAt||new Date().toISOString());
 const expiresAt=row.data.expiresAt||new Date(now.getTime()+30*24*60*60*1000).toISOString();
 const paid:PaymentRecord={...row.data,status:'paid',paymentId:row.data.paymentId||paymentId,paidAt:now.toISOString(),expiresAt};
 if(row.data.status!=='paid')await updateRecord(row.row_id,paid,{ownerTokenHash:row.owner_token_hash||undefined});
 await putRecord('purchase_entitlements',orderId,{
  orderId,paymentId,planId:paid.planId,planName:paid.planName,kind:paid.kind,
  amount:paid.amount,status:'active',createdAt:now.toISOString(),expiresAt,
  contactLimit:paid.contactLimit||0,contactsUsed:0,profileLimit:paid.profileLimit||0,profilesUsed:0,
  customer:paid.customer,
 },{ownerTokenHash:row.owner_token_hash,createdAt:now.toISOString()});
 await audit(`Razorpay payment captured for order ${orderId}; ${paid.planName} activated`);
 return paid;
}
