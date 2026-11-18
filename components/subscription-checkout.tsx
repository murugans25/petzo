'use client';
import {useEffect,useState} from 'react';
import {CheckCircle2,ExternalLink,PawPrint,ShieldCheck,X} from 'lucide-react';

export type PlanId='pairing_monthly'|'buyer_contacts'|'seller_individual'|'seller_breeder';
type Props={close:()=>void;planId?:PlanId};
type OrderResult={orderId:string;amount:number;currency:'INR';keyId:string;planName:string;accessToken:string};
type PaymentResult={status:'created'|'paid';planName:string;expiresAt:string|null;amount:number};
type RazorpaySuccess={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
type RazorpayOptions={key:string;amount:number;currency:string;name:string;description:string;order_id:string;prefill:{name:string;email:string;contact:string};theme:{color:string};handler:(response:RazorpaySuccess)=>void;modal:{ondismiss:()=>void}};
declare global{interface Window{Razorpay?:new(options:RazorpayOptions)=>{open:()=>void}}}
const PLAN_COPY:Record<PlanId,{title:string;displayTitle?:string;description:string;limit?:string;benefit?:string}>={
 pairing_monthly:{title:'Unlimited owner contacts - 30 days',displayTitle:'Connect with pet parents',description:'Contact any eligible pet owner for mating introductions during your 30-day plan. Browsing and adoption stay free.',limit:'No contact limit',benefit:'Get unlimited contacts for one month'},
 buyer_contacts:{title:'Buyer contact plan',description:'Contact up to 8 pet sellers for one month.',limit:'8 seller contacts · 1 month'},
 seller_individual:{title:'Individual seller plan',description:'Publish up to 8 pet profiles for one month.',limit:'8 pet profiles · 1 month'},
 seller_breeder:{title:'Breeder plan',description:'Publish up to 15 pet profiles for one month.',limit:'15 pet profiles · 1 month'},
};

async function loadRazorpay(){
 if(window.Razorpay)return;
 await new Promise<void>((resolve,reject)=>{
  const existing=document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
  if(existing){existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>reject(new Error('Could not load Razorpay Checkout.')),{once:true});return}
  const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;script.dataset.razorpayCheckout='true';script.onload=()=>resolve();script.onerror=()=>reject(new Error('Could not load Razorpay Checkout.'));document.body.appendChild(script);
 });
 if(!window.Razorpay)throw new Error('Razorpay Checkout is unavailable.');
}

export default function SubscriptionCheckout({close,planId='pairing_monthly'}:Props){
 const plan=PLAN_COPY[planId];
 const [details,setDetails]=useState({name:'',email:'',phone:'',petName:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[payment,setPayment]=useState<PaymentResult|null>(null),[accessToken,setAccessToken]=useState('');
 useEffect(()=>{const saved=window.localStorage.getItem('petzo-subscription-token');if(saved)setAccessToken(saved)},[]);
 useEffect(()=>{if(!accessToken)return;let stopped=false;const poll=async()=>{try{const response=await fetch(`/api/payments?token=${encodeURIComponent(accessToken)}`,{cache:'no-store'});const data=await response.json();const paid=data.payments?.find((item:PaymentResult)=>item.status==='paid'&&item.planName===plan.title);if(response.ok&&paid&&!stopped)setPayment(paid)}catch{}};void poll();const interval=window.setInterval(()=>void poll(),6000);return()=>{stopped=true;window.clearInterval(interval)}},[accessToken,plan.title]);

 async function startPayment(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');
  try{
   await loadRazorpay();
   const response=await fetch('/api/payments/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({planId,...details,accessToken:window.localStorage.getItem('petzo-subscription-token')||undefined})});
   const order=await response.json() as OrderResult&{error?:string};if(!response.ok)throw new Error(order.error||'Could not start secure checkout.');
   window.localStorage.setItem('petzo-subscription-token',order.accessToken);setAccessToken(order.accessToken);
   const checkout=new window.Razorpay!({key:order.keyId,amount:order.amount,currency:order.currency,name:'Petzo',description:order.planName,order_id:order.orderId,prefill:{name:details.name,email:details.email,contact:details.phone},theme:{color:'#641a46'},handler:async(result)=>{
    setBusy(true);setError('');
    try{const verified=await fetch('/api/payments/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...result,accessToken:order.accessToken})});const outcome=await verified.json();if(verified.status===202){setError('Payment received. Razorpay is confirming capture; this page will update automatically.');return}if(!verified.ok)throw new Error(outcome.error||'Could not verify payment.');setPayment({status:'paid',planName:order.planName,amount:order.amount/100,expiresAt:outcome.expiresAt||null})}
    catch(problem){setError(problem instanceof Error?problem.message:'Payment verification is still processing. This page will update automatically.')}
    finally{setBusy(false)}
   },modal:{ondismiss:()=>setBusy(false)}});
   checkout.open();
  }catch(problem){setError(problem instanceof Error?problem.message:'Could not start payment. Please try again.');setBusy(false)}
 }
 return <section className="subscription-modal" role="dialog" aria-modal="true" aria-label={`${plan.title} payment`}>
  <button className="close" aria-label="Close payment window" onClick={close}><X/></button>
  <span className="modal-paw"><PawPrint size={28}/></span><span className="subscription-kicker">PETZO · SECURE CHECKOUT</span>
  <h2>{payment?'Your plan is active':plan.displayTitle||plan.title}</h2>
  {payment?<div className="subscription-state approved"><CheckCircle2/><div><b>Payment verified automatically</b><p>{payment.planName} is active until {payment.expiresAt?new Date(payment.expiresAt).toLocaleDateString('en-IN'):'your plan expires'}.</p></div></div>:<>
   <p>{plan.description} Free browsing and adoption stay available to everyone.</p>
   <div className="subscription-payment"><div className="subscription-qr"><span className="modal-paw"><ShieldCheck size={30}/></span><b>Razorpay secure checkout</b><span>UPI, cards and supported payment methods</span></div><div className="subscription-payee"><span>PLAN PRICE</span><b>{plan.displayTitle||plan.title}</b>{plan.limit&&<code>{plan.limit}</code>}<div className="subscription-price-row"><strong>₹{planId==='pairing_monthly'||planId==='seller_breeder'?399:199}.00</strong>{plan.benefit&&<span className="subscription-plan-benefit">{plan.benefit}</span>}</div><span>Plan activates after Razorpay confirms payment.</span></div></div>
   <form className="subscription-form" onSubmit={startPayment}><label>Your name<input required minLength={2} maxLength={100} autoComplete="name" value={details.name} onChange={e=>setDetails({...details,name:e.target.value})}/></label><div className="subscription-form-grid"><label>Email<input required type="email" maxLength={200} autoComplete="email" value={details.email} onChange={e=>setDetails({...details,email:e.target.value})}/></label><label>Phone<input required type="tel" minLength={7} maxLength={24} autoComplete="tel" value={details.phone} onChange={e=>setDetails({...details,phone:e.target.value})}/></label></div>{planId==='pairing_monthly'&&<label>Pet name<input required minLength={2} maxLength={80} value={details.petName} onChange={e=>setDetails({...details,petName:e.target.value})}/></label>}{error&&<div className="admin-alert error" role="alert">{error}</div>}<p className="subscription-privacy"><ShieldCheck size={15}/>Payment is confirmed by Razorpay server verification/webhook. Petzo admin approval is not required.</p><button className="button full" disabled={busy}>{busy?'Opening secure checkout…':`Pay securely · ₹${planId==='pairing_monthly'||planId==='seller_breeder'?399:199}`} <ExternalLink size={16}/></button><small className="subscription-disclaimer">Do not close this page until checkout finishes. If your bank confirms payment but this page is still processing, it will update when Razorpay sends its confirmation.</small></form>
  </>}
  {payment&&<button className="button full subscription-done" onClick={close}>Continue</button>}<button className="subscription-free-note" onClick={close}>Browsing and adoption remain free</button>
 </section>
}
