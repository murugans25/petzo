'use client';
import {useEffect,useMemo,useState} from 'react';
import {CheckCircle2,Clock,Copy,ExternalLink,PawPrint,ShieldCheck,X,XCircle} from 'lucide-react';

const PRICE=399;
const UPI_ID='vaishnavi21596-5@okicici';
const PAYEE='Vaishnavi R';
type PaymentStatus={status:'pending'|'approved'|'declined';expiresAt:string|null;reviewNote:string;amount:number};

export default function SubscriptionCheckout({close}:{close:()=>void}){
 const [details,setDetails]=useState({name:'',email:'',phone:'',petName:'',utr:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState<PaymentStatus|null>(null),[copied,setCopied]=useState(false);
 const [accessToken,setAccessToken]=useState('');
 const upiUri=useMemo(()=>`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE)}&am=${PRICE}&cu=INR` ,[]);

 useEffect(()=>{const saved=window.localStorage.getItem('petzo-subscription-token');if(saved)setAccessToken(saved)},[]);
 useEffect(()=>{if(!accessToken)return;let cancelled=false;const load=async()=>{try{const response=await fetch(`/api/subscriptions?token=${encodeURIComponent(accessToken)}`,{cache:'no-store'});const data=await response.json();if(response.ok&&!cancelled)setStatus(data)}catch{}};void load();const timer=window.setInterval(()=>void load(),status?.status==='pending'?8000:30000);return()=>{cancelled=true;window.clearInterval(timer)}},[accessToken,status?.status]);

 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError('');try{const response=await fetch('/api/subscriptions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...details,amount:PRICE})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not send your payment request.');window.localStorage.setItem('petzo-subscription-token',data.accessToken);setAccessToken(data.accessToken);setStatus({status:'pending',expiresAt:null,reviewNote:'',amount:PRICE})}catch(e){setError(e instanceof Error?e.message:'Could not send your request.')}finally{setBusy(false)}}
 async function copyUpi(){try{await navigator.clipboard.writeText(UPI_ID);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}catch{setError('Copy is not available here. You can enter the UPI ID manually.')}}
 const approved=status?.status==='approved',declined=status?.status==='declined';
 return <section className="subscription-modal" role="dialog" aria-modal="true" aria-label="Petzo Premium payment">
  <button className="close" aria-label="Close payment window" onClick={close}><X/></button>
  <span className="modal-paw"><PawPrint size={28}/></span>
  <span className="subscription-kicker">PETZO PREMIUM · ONE MONTH</span>
  <h2>{approved?'Premium is active':declined?'Payment needs attention':'Feature your pet & connect'}</h2>
  {approved?<div className="subscription-state approved"><CheckCircle2/><div><b>Payment verified by Petzo admin</b><p>Premium access is active until {status?.expiresAt?new Date(status.expiresAt).toLocaleDateString('en-IN'):'the end of your plan period'}.</p></div></div>:declined?<div className="subscription-state declined"><XCircle/><div><b>Request declined</b><p>{status?.reviewNote||'Please check the UTR and contact Petzo before sending another payment.'}</p></div></div>:<>
   <p>Pay ₹399 using UPI. Your membership starts only after the admin verifies the payment in the UPI account.</p>
   <div className="subscription-payment"><div className="subscription-qr"><img src="/api/payment-qr" alt="UPI payment QR for Petzo Premium, ₹399"/><span>Scan using any UPI app</span></div><div className="subscription-payee"><span>PAY TO</span><b>{PAYEE}</b><code>{UPI_ID}</code><strong>₹399.00</strong><button type="button" className="outline-button" onClick={()=>void copyUpi()}><Copy size={16}/>{copied?'Copied':'Copy UPI ID'}</button><a className="button" href={upiUri}>Open UPI app <ExternalLink size={16}/></a></div></div>
   {status?.status==='pending'?<div className="subscription-state pending"><Clock/><div><b>Payment submitted · awaiting admin verification</b><p>This page checks for approval automatically. Keep this browser on this device to view your request status.</p></div></div>:<form className="subscription-form" onSubmit={submit}>
    <h3>Already paid? Submit the transaction details.</h3>
    <label>Your name<input required minLength={2} maxLength={100} value={details.name} onChange={e=>setDetails({...details,name:e.target.value})}/></label>
    <div className="subscription-form-grid"><label>Email<input required type="email" maxLength={200} value={details.email} onChange={e=>setDetails({...details,email:e.target.value})}/></label><label>Phone<input required type="tel" minLength={7} maxLength={24} value={details.phone} onChange={e=>setDetails({...details,phone:e.target.value})}/></label></div>
    <div className="subscription-form-grid"><label>Pet name<input required minLength={2} maxLength={80} value={details.petName} onChange={e=>setDetails({...details,petName:e.target.value})}/></label><label>UPI UTR / reference<input required minLength={6} maxLength={32} pattern="[A-Za-z0-9-]+" value={details.utr} onChange={e=>setDetails({...details,utr:e.target.value})} placeholder="From your payment receipt"/></label></div>
    {error&&<div className="admin-alert error" role="alert">{error}</div>}
    <p className="subscription-privacy"><ShieldCheck size={15}/>Contact details and UTR are private and visible only to Petzo admin for payment review.</p>
    <button className="button full" disabled={busy}>{busy?'Submitting…':'I have paid ₹399 · Submit for review'}</button>
    <small className="subscription-disclaimer">Do not submit until your UPI app confirms success. A submitted UTR is not proof of payment by itself.</small>
   </form>}
   {error&&status?.status==='pending'&&<div className="admin-alert error" role="alert">{error}</div>}
  </>}
  {approved&&<button className="button full subscription-done" onClick={close}>Continue browsing</button>}
  <button className="subscription-free-note" onClick={close}>Browsing and adoption remain free</button>
 </section>
}
