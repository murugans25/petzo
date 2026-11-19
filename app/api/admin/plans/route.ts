import { NextRequest, NextResponse } from 'next/server';
import { guard } from '../../../../lib/server/admin-auth';
import { BUSINESS_PLANS } from '../../../../lib/business-plans';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  return NextResponse.json({ plans: BUSINESS_PLANS }, { headers: { 'Cache-Control': 'no-store' } });
}

function fixedPricingResponse() {
  return NextResponse.json(
    { error: 'Pricing is managed in the application and cannot be changed in admin.' },
    { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } },
  );
}

export async function POST() { return fixedPricingResponse(); }
export async function PUT() { return fixedPricingResponse(); }
export async function DELETE() { return fixedPricingResponse(); }
