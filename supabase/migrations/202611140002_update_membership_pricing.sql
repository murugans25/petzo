-- Keep the previously seeded Petzo plans aligned with the current pricing proposal.
update public.membership_plans
set price = 399,
    duration_months = 1,
    description = '₹399 per month for a featured pet listing and owner connections. Payment setup is required before subscriptions can be activated.',
    features = array[
      'Feature your pet listing',
      'Contact pet owners and send mating requests',
      'Keep browsing every public profile for free'
    ],
    updated_at = now()
where name = 'Premium' and premium = true and price = 499;

update public.membership_plans
set description = 'Browse all public listings and use Petzo adoption at no cost.',
    features = array[
      'Browse all approved pet profiles',
      'Save favourite profiles',
      'Browse pets and send adoption requests for free'
    ],
    updated_at = now()
where name = 'Free' and premium = false and price = 0;
