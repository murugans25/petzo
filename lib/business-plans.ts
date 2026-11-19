import type { Plan } from './catalog-types';

/** Petzo pricing is intentionally code-managed; it is not editable in admin. */
export const BUSINESS_PLANS: Plan[] = [
  {
    id: 1,
    name: 'Connect with pet parents',
    price: 399,
    months: 1,
    description: 'Get unlimited owner contacts for mating introductions for one month.',
    features: ['Unlimited mating contacts', 'Valid for 1 month after payment', 'Browse matching profiles for free'],
    active: true,
    premium: true,
    paymentPlanId: 'pairing_monthly',
  },
  {
    id: 2,
    name: 'Buyer contacts',
    price: 199,
    months: 1,
    description: 'Contact up to 8 pet sellers during your one-month plan.',
    features: ['Up to 8 seller contacts', 'Valid for 1 month after payment', 'Browse Buy & Sell listings for free'],
    active: true,
    premium: true,
    paymentPlanId: 'buyer_contacts',
  },
  {
    id: 3,
    name: 'Individual seller',
    price: 199,
    months: 1,
    description: 'Publish up to 8 pet profiles for sale for one month.',
    features: ['Up to 8 pet profiles', 'One pet per profile', 'At least 3 photos per pet', 'Valid for 1 month after payment'],
    active: true,
    premium: true,
    paymentPlanId: 'seller_individual',
  },
  {
    id: 4,
    name: 'Breeder listings',
    price: 399,
    months: 1,
    description: 'Manage up to 15 pet profiles for sale for one month.',
    features: ['Up to 15 pet profiles', 'One pet per profile', 'At least 3 photos per pet', 'Valid for 1 month after payment'],
    active: true,
    premium: true,
    paymentPlanId: 'seller_breeder',
  },
];
