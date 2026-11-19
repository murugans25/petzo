'use client';

import { ArrowRight, Check } from 'lucide-react';
import { BUSINESS_PLANS } from '../lib/business-plans';
import type { PlanId } from './subscription-checkout';

type Props = {
  select: (planId: PlanId) => void;
  adopt: () => void;
  browse: () => void;
};

export default function MembershipPlans({ select, adopt, browse }: Props) {
  return (
    <section className="section plans">
      <div className="eyebrow">CLEAR PRICING · THOUGHTFUL CONNECTIONS</div>
      <h1>Browse freely. Choose a plan when you connect.</h1>
      <p>Creating an account, adding a pet profile, browsing matches and viewing Buy a pet listings are free. Pay only when you need contact access or seller listing capacity.</p>

      <article className="plan free-plan">
        <span>FREE COMMUNITY ACCESS</span>
        <h2>Free</h2>
        <h3>₹0 <small>always</small></h3>
        <p>Get started and explore Petzo without paying.</p>
        <ul>
          {['Create an account and pet profile', 'Browse matching profiles', 'Browse Buy a pet listings', 'Adoption listings and requests'].map((item) => (
            <li key={item}><Check size={17} />{item}</li>
          ))}
        </ul>
        <button className="outline-button" onClick={browse}>Browse pets for free <ArrowRight size={17} /></button>
      </article>

      <div className="plan-grid">
        {BUSINESS_PLANS.map((plan) => (
          <article className="plan premium" key={plan.id}>
            <span>{plan.name === 'Breeder listings' ? 'FOR BREEDERS' : plan.name === 'Individual seller' ? 'FOR INDIVIDUAL OWNERS' : plan.name === 'Buyer contacts' ? 'FOR PET BUYERS' : 'FOR MATING CONNECTIONS'}</span>
            <h2>{plan.name}</h2>
            <h3>₹{plan.price.toLocaleString('en-IN')}<small> / {plan.months} month</small></h3>
            <p>{plan.description}</p>
            <ul>{plan.features.map((feature) => <li key={feature}><Check size={17} />{feature}</li>)}</ul>
            <button className="button" onClick={() => select(plan.paymentPlanId!)}>Continue to payment <ArrowRight size={17} /></button>
          </article>
        ))}
      </div>

      <div className="adoption-plans-note">
        <div><b>Adoption stays free.</b><p>Browse available pets and send adoption requests at no cost. No subscription is required at any step.</p></div>
        <button className="outline-button" onClick={adopt}>Explore adoption <ArrowRight size={16} /></button>
      </div>
      <p className="plans-payment-note">Razorpay confirms successful payments and activates eligible access automatically. Petzo does not charge for adoption.</p>
    </section>
  );
}
