'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Building2, Check, CircleHelp, Dog, MapPin, PawPrint, Plus, RefreshCw, Search, ShieldCheck, Store, X } from 'lucide-react';
import SubscriptionCheckout from './subscription-checkout';
import type { PlanId } from './subscription-checkout';
import '../app/breeder.css';

const tokenKey = 'petzo-breeder-token';
type MatchingPet = { id: number; name: string; breed: string; type: string; gender: string; age: string; location: string; image: string; availability: boolean };
type SaleListing = { id: number; petName: string; breed: string; type: string; age: string; gender: string; location: string; price: number; photos: string[]; status: string };
type Enquiry = { id: number; listingId: number; petName: string; buyerName: string; buyerEmail: string; buyerPhone: string; message: string; status: string; createdAt: string };
type DashboardData = {
  profile: { name: string; email: string; phone: string; city: string; businessName: string; registrationNumber: string; verification: string };
  plan: { active: boolean; profileLimit: number; profilesUsed: number; expiresAt: string | null };
  listings: SaleListing[];
  matchingProfiles: MatchingPet[];
  enquiries: Enquiry[];
};

export default function BreederDashboard({ embedded = false, close, addMatchPet, addSaleListing, findMatches }: { embedded?: boolean; close?: () => void; addMatchPet: () => void; addSaleListing: () => void; findMatches: (pet: MatchingPet) => void }) {
  const [token, setToken] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  const loadDashboard = useCallback(async (accessToken: string) => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/breeder/dashboard?token=${encodeURIComponent(accessToken)}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load your breeder dashboard.');
      setData(result as DashboardData); setToken(accessToken);
    } catch (reason) {
      setData(null);
      if (reason instanceof Error && !reason.message.startsWith('No breeder profile')) setError(reason.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(tokenKey) || '';
    const planToken = localStorage.getItem('petzo-subscription-token') || '';
    if (saved) void loadDashboard(saved);
    else if (planToken) { setToken(planToken); void loadDashboard(planToken); }
    else setLoading(false);
  }, [loadDashboard]);

  useEffect(() => {
    if (!token) return;
    const refresh = () => void loadDashboard(token);
    window.addEventListener('petzo-discovery-updated', refresh);
    return () => window.removeEventListener('petzo-discovery-updated', refresh);
  }, [loadDashboard, token]);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/breeder/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: values.get('name'), email: values.get('email'), phone: values.get('phone'), city: values.get('city'), businessName: values.get('businessName'), registrationNumber: values.get('registrationNumber') || '',
        accessToken: token || localStorage.getItem('petzo-subscription-token') || undefined,
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not register your breeder profile.');
      localStorage.setItem(tokenKey, result.token); localStorage.setItem('petzo-subscription-token', result.token);
      setNotice('Your breeder profile is ready. You can add breeding pets for free or activate the 15-listing plan.');
      await loadDashboard(result.token);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not register your breeder profile.'); }
    finally { setSaving(false); }
  }

  async function updateEnquiry(item: Enquiry, status: 'accepted' | 'declined') {
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/breeder/dashboard', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, listingId: item.listingId, enquiryId: item.id, status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update the enquiry.');
      setData(current => current ? { ...current, enquiries: current.enquiries.map(enquiry => enquiry.id === item.id ? { ...enquiry, status } : enquiry) } : current);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update the enquiry.'); }
    finally { setSaving(false); }
  }

  function closeCheckout() {
    setShowCheckout(false);
    const saved = localStorage.getItem(tokenKey) || localStorage.getItem('petzo-subscription-token') || '';
    if (saved) void loadDashboard(saved);
  }

  const containerClass = embedded ? 'breeder-page' : 'breeder-overlay';
  if (loading) return <div className={containerClass}><section className="breeder-dashboard"><p className="breeder-loading"><RefreshCw className="spin"/> Loading your breeder space…</p></section></div>;

  return <div className={containerClass}>
    <section className="breeder-dashboard" role="region" aria-label="Petzo breeder dashboard">
      <div className="breeder-dashboard-top"><a className="breeder-brand" href="/" aria-label="Petzo home"><PawPrint/><span>Petzo <small>BREEDER STUDIO</small></span></a>{close&&<button className="breeder-close" onClick={close} aria-label="Close breeder dashboard"><X/></button>}</div>
      {data ? <>
        <div className="breeder-welcome"><div><span className="breeder-kicker">YOUR BREEDING SPACE</span><h1>Welcome, {data.profile.name.split(' ')[0]}.</h1><p>Manage your breeding profiles, sale listings and buyer enquiries in one place.</p></div><div className="breeder-identity"><Building2 size={19}/><span><b>{data.profile.businessName}</b><small><MapPin size={13}/>{data.profile.city}</small></span></div></div>
        {error&&<p className="breeder-alert" role="alert">{error}</p>}{notice&&<p className="breeder-notice" role="status"><Check size={16}/>{notice}</p>}
        <div className="breeder-stats"><article><PawPrint/><span>Breeding pets</span><strong>{data.matchingProfiles.length}</strong></article><article><Store/><span>Sale listings</span><strong>{data.listings.length}</strong></article><article><CircleHelp/><span>Buyer enquiries</span><strong>{data.enquiries.length}</strong></article></div>
        <section className="breeder-plan-card"><div><span className="breeder-kicker">BREEDER SELLER PLAN</span><h2>{data.plan.active?'Your 15-profile plan is active':'List pets for sale when you are ready'}</h2><p>{data.plan.active?`${data.plan.profilesUsed} of ${data.plan.profileLimit} profile slots used${data.plan.expiresAt?` · valid until ${new Date(data.plan.expiresAt).toLocaleDateString('en-IN')}`:''}`:'₹399 · up to 15 pet sale profiles · 1 month. Breeding profiles and basic match browsing remain free.'}</p></div><button className="breeder-primary" onClick={data.plan.active?addSaleListing:()=>setShowCheckout(true)}>{data.plan.active?'Add sale listing':'Get breeder plan'}<ArrowRight size={17}/></button></section>
        <div className="breeder-section-heading"><div><span className="breeder-kicker">MATCH WITH CARE</span><h2>Your breeding profiles</h2><p>Add pets for free. Open matches for a pet to see compatible listings.</p></div><button className="breeder-outline" onClick={addMatchPet}><Plus size={16}/>Register a breed</button></div>
        {data.matchingProfiles.length ? <div className="breeder-pet-grid">{data.matchingProfiles.map(pet=><article className="breeder-pet-card" key={pet.id}><img src={pet.image.startsWith('/')?pet.image:pet.image} alt={`${pet.name}, ${pet.breed}`}/><div><span className="breeder-pet-type">{pet.type} · {pet.gender}</span><h3>{pet.name}</h3><p>{pet.breed} · {pet.age}</p><small><MapPin size={13}/>{pet.location}</small><button className="breeder-match-button" disabled={!pet.availability} onClick={()=>findMatches(pet)}><Search size={15}/>{pet.availability?'Find matches for this pet':'Mark this pet available to find matches'}</button></div></article>)}</div> : <div className="breeder-empty"><Dog/><h3>Your first breeding profile starts here</h3><p>Add your pet details and photos. Then choose that pet to see matches.</p><button className="breeder-primary" onClick={addMatchPet}>Register a breed <ArrowRight size={16}/></button></div>}
        <div className="breeder-section-heading breeder-listing-heading"><div><span className="breeder-kicker">YOUR PET MARKET</span><h2>Sale listings</h2></div></div>
        {data.listings.length ? <div className="breeder-listing-list">{data.listings.map(listing=><article key={listing.id}><img src={listing.photos?.[0]||'/pets/photo-1552053831-71594a27632d.jpg'} alt={listing.petName}/><div><h3>{listing.petName}</h3><p>{listing.breed} · {listing.age} · {listing.gender} · ₹{listing.price.toLocaleString('en-IN')}</p><small>{listing.location} · {listing.status}</small></div></article>)}</div> : <div className="breeder-empty breeder-empty-compact"><Store/><p>Your paid sale listings will appear here.</p></div>}
        <div className="breeder-section-heading breeder-listing-heading"><div><span className="breeder-kicker">PRIVATE TO YOUR ACCOUNT</span><h2>Buyer enquiries</h2></div></div>
        {data.enquiries.length ? <div className="breeder-enquiry-list">{data.enquiries.map(item=><article key={item.id}><div><span className="breeder-pet-type">FOR {item.petName}</span><h3>{item.buyerName}</h3><p>{item.message}</p><a href={`tel:${item.buyerPhone}`}>{item.buyerPhone}</a> · <a href={`mailto:${item.buyerEmail}`}>{item.buyerEmail}</a></div><div className="breeder-enquiry-actions"><span>{item.status}</span>{item.status==='pending'&&<><button disabled={saving} onClick={()=>void updateEnquiry(item,'declined')}>Decline</button><button disabled={saving} onClick={()=>void updateEnquiry(item,'accepted')}>Accept</button></>}</div></article>)}</div> : <div className="breeder-empty breeder-empty-compact"><ShieldCheck/><p>New buyer enquiries will appear here.</p></div>}
        <p className="breeder-disclaimer"><ShieldCheck size={15}/>Breeder details and registration are not independently verified by Petzo. For mating contacts, the separate ₹399 monthly Pairing plan applies.</p>
      </> : <>
        <div className="breeder-register-hero"><span className="breeder-kicker">JOIN PETZO AS A BREEDER</span><h1>Register a breed</h1><p>Create a free breeder dashboard to register your dogs or cats for matching. You can also manage sale listings and buyer enquiries here.</p></div>
        {error&&<p className="breeder-alert" role="alert">{error}</p>}
        <form className="breeder-register-form" onSubmit={register}><h2>Breeder details</h2><div className="breeder-form-grid"><label>Your name<input name="name" required minLength={2} autoComplete="name"/></label><label>Business / kennel name<input name="businessName" required minLength={2}/></label><label>Email<input type="email" name="email" required autoComplete="email"/></label><label>Phone<input type="tel" name="phone" required minLength={7} autoComplete="tel"/></label><label>City<input name="city" required minLength={2} autoComplete="address-level2"/></label><label>Breeder registration reference <small>Optional. Petzo has not verified it.</small><input name="registrationNumber"/></label></div><button className="breeder-primary" disabled={saving}>{saving?'Creating your breeder space…':'Create breeder dashboard'}<ArrowRight size={17}/></button><p>Your private dashboard access is saved in this browser. Use a trusted device and do not share it.</p></form>
        <div className="breeder-free-callout"><Check size={17}/>Free breeder registration · Free breeding profiles · ₹399 seller plan only for up to 15 sale listings</div>
      </>}
      {showCheckout&&<div className="overlay" onClick={()=>setShowCheckout(false)}><div onClick={event=>event.stopPropagation()}><SubscriptionCheckout planId={'seller_breeder' as PlanId} close={closeCheckout}/></div></div>}
    </section>
  </div>;
}
