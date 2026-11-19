'use client';

import { ArrowRight, Check, Clock3, PawPrint } from 'lucide-react';
import type { Plan } from '../lib/catalog-types';
import type { PlanId } from './subscription-checkout';

type Props = {
  plans?: Plan[];
  select: (planId: PlanId) => void;
  adopt: () => void;
  browse: () => void;
};

const checkoutPlans: Record<PlanId, { expectedPrice: number; purpose: string }> = {
  pairing_monthly: { expectedPrice: 399, purpose: 'pairing' },
  buyer_contacts: { expectedPrice: 199, purpose: 'buyer' },
  seller_individual: { expectedPrice: 199, purpose: 'individual seller' },
  seller_breeder: { expectedPrice: 399, purpose: 'breeder' },
};

function checkoutPlanFor(plan: Plan): PlanId | null {
  const text = `${plan.name} ${plan.description} ${plan.features.join(' ')}`.toLowerCase();
  if (text.includes('breeder') || text.includes('15 pet')) return 'seller_breeder';
  if (text.includes('individual seller') || text.includes('8 pet profile')) return 'seller_individual';
  if (text.includes('buyer') || text.includes('seller contact')) return 'buyer_contacts';
  if (text.includes('pair') || text.includes('mat') || text.includes('owner contact')) return 'pairing_monthly';
  return null;
}

export default function MembershipPlans({ plans = [], select, adopt, browse }: Props) {
  // `active` is the admin's explicit “Visible on user website” switch.
  const visiblePlans = plans.filter((plan) => plan.active);

  return (
    <section className="section plans">
      <div className="eyebrow">CLEAR PRICING · THOUGHTFUL CONNECTIONS</div>
      <h1>Browse freely. Choose a plan when you connect.</h1>
      <p>Account registration, pet profiles, matching and marketplace browsing are free. Choose a paid plan only for the contacts or listing capacity you need.</p>

      <article className="plan free-plan">
        <span>FREE COMMUNITY ACCESS</span>
        <h2>Free</h2>
        <h3>₹0 <small>always</small></h3>
        <p>Get started and explore Petzo without paying.</p>
        <ul>
          {['Create an account', 'Add a pet profile and browse matches', 'Browse Buy & Sell listings', 'Adoption listings and requests'].map((item) => (
            <li key={item}><Check size={17} />{item}</li>
          ))}
        </ul>
        <button className="outline-button" onClick={browse}>Browse pets for free <ArrowRight size={17} /></button>
      </article>

      {visiblePlans.length > 0 ? (
        <div className="plan-grid">
          {visiblePlans.map((plan) => {
            const checkoutId = checkoutPlanFor(plan);
            const checkout = checkoutId ? checkoutPlans[checkoutId] : null;
            const paymentReady = Boolean(checkout && checkout.expectedPrice === plan.price && plan.months === 1);

            return (
              <article className="plan premium" key={plan.id}>
                <span>{plan.premium ? 'PETZO MEMBERSHIP' : 'COMMUNITY PLAN'}</span>
                <h2>{plan.name}</h2>
                <h3>₹{plan.price.toLocaleString('en-IN')}<small> / {plan.months} {plan.months === 1 ? 'month' : 'months'}</small></h3>
                <p>{plan.description}</p>
                <ul>{plan.features.map((feature, index) => <li key={`${plan.id}-${index}`}><Check size={17} />{feature}</li>)}</ul>
                {paymentReady && checkoutId ? (
                  <button className="button" onClick={() => select(checkoutId)}>Continue to payment <ArrowRight size={17} /></button>
                ) : (
                  <button className="outline-button" disabled title="Payment setup is not configured for this plan yet.">Payment setup required <Clock3 size={16} /></button>
                )}
                {!paymentReady && <small className="plans-payment-note">This plan is visible. Checkout must be configured for its price and purpose before customers can pay.</small>}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="plan-empty" role="status">
          <PawPrint size={22} />
          <div><b>No paid plans are currently published.</b><p>When an active plan is saved in admin, it will appear here.</p></div>
        </div>
      )}

      <div className="adoption-plans-note">
        <div><b>Adoption stays free.</b><p>Browse available pets and send adoption requests at no cost. No subscription is required at any step.</p></div>
        <button className="outline-button" onClick={adopt}>Explore adoption <ArrowRight size={16} /></button>
      </div>
      <p className="plans-payment-note">Razorpay confirms successful payments automatically. Plans activate after payment capture; adoption remains free.</p>
    </section>
  );
}
