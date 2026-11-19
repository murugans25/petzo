'use client';

import { useEffect, useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';

type Entitlement = { planName: string; status: string; expiresAt: string | null };

export default function PlanExpiryReminder({ manage }: { manage: () => void }) {
  const [ending, setEnding] = useState<Entitlement | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem('petzo-subscription-token');
    if (!token) return;
    let cancelled = false;
    fetch(`/api/payments?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async response => response.ok ? response.json() : null)
      .then(data => {
        if (cancelled || !data?.payments) return;
        const now = Date.now();
        const expiring = (data.payments as Entitlement[])
          .filter(item => item.status === 'paid' && item.expiresAt)
          .filter(item => Date.parse(item.expiresAt!) > now)
          .map(item => ({ ...item, days: Math.ceil((Date.parse(item.expiresAt!) - now) / 86400000) }))
          .filter(item => item.days >= 0 && item.days <= 3)
          .sort((a, b) => a.days - b.days)[0];
        if (expiring) setEnding(expiring);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  if (!ending) return null;
  const days = Math.ceil((Date.parse(ending.expiresAt!) - Date.now()) / 86400000);
  return <aside className="plan-expiry-reminder" role="status">
    <Clock size={18} aria-hidden="true" />
    <span><b>{ending.planName}</b> {days === 0 ? 'expires today' : `expires in ${days} day${days === 1 ? '' : 's'}`}. Renew to keep plan access.</span>
    <button type="button" onClick={manage}>View plans <ArrowRight size={15}/></button>
  </aside>;
}
