import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '../../../../lib/server/database';
import { localEnabled, validOrigin } from '../../../../lib/server/admin-auth';
import { hashOwnerToken } from '../../../../lib/server/adoption-access';
import { getRecordById, insertRecord, listRecords, updateRecord } from '../../../../lib/server/supabase-data';
import type { PetMarketEnquiry, PetMarketListing } from '../../../../lib/pet-market-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(2).max(100),
  businessName: z.string().trim().min(2).max(150),
  registrationNumber: z.string().trim().max(100).default(''),
  accessToken: z.string().regex(/^[A-Za-z0-9_-]{40,60}$/).optional(),
}).strict();

const errorResponse = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest) {
  if (!localEnabled()) return errorResponse('Breeder registration is unavailable.', 503);
  if (!validOrigin(request)) return errorResponse('Invalid request origin.', 403);
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(parsed.error.issues.map(issue => issue.message).join('; '), 400);

  try {
    const token = parsed.data.accessToken || randomBytes(32).toString('base64url');
    const createdAt = new Date().toISOString();
    const { accessToken: _accessToken, ...profileDetails } = parsed.data;
    const profile = { ...profileDetails, role: 'breeder', verification: 'not_verified', createdAt, updatedAt: createdAt };
    const ownerTokenHash = hashOwnerToken(token);
    await insertRecord('breeder_profiles', profile, { ownerTokenHash, createdAt, updatedAt: createdAt });
    await audit('Breeder created a Petzo breeder profile');
    return NextResponse.json({ profile, token }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return errorResponse('Could not create the breeder profile. Please try again.', 503);
  }
}

export async function GET(request: NextRequest) {
  if (!localEnabled()) return errorResponse('Breeder dashboard is unavailable.', 503);
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return errorResponse('Your private breeder access is missing. Reopen your saved breeder dashboard on this device.', 401);
  const ownerTokenHash = hashOwnerToken(token);

  try {
    const [profiles, entitlements, listings, pets] = await Promise.all([
      listRecords<Record<string, unknown>>('breeder_profiles', { ownerTokenHash, ascending: false }),
      listRecords<Record<string, unknown>>('purchase_entitlements', { ownerTokenHash, ascending: false }),
      listRecords<PetMarketListing>('pet_market_listings', { ownerTokenHash, ascending: false }),
      listRecords<Record<string, unknown>>('pets', { ownerTokenHash, ascending: false }),
    ]);
    const profile = profiles[0]?.data;
    if (!profile) return errorResponse('No breeder profile is linked to this private access.', 404);

    const activePlans = entitlements.map(row => row.data).filter(item => item.planId === 'seller_breeder' && item.kind === 'seller_profiles' && item.status === 'active' && typeof item.expiresAt === 'string' && Date.parse(item.expiresAt) > Date.now());
    const now = Date.now();
    const petListings = listings.map(row => row.data).filter(listing => !listing.planExpiresAt || Date.parse(listing.planExpiresAt) > now);
    const inquiries = (await Promise.all(petListings.map(async listing => {
      const rows = await listRecords<PetMarketEnquiry>('pet_market_enquiries', { listingId: listing.id, ascending: false });
      return rows.map(row => ({ ...row.data, petName: listing.petName, listingId: listing.id }));
    }))).flat();
    const matchingProfiles = pets.map(row => ({
      id: Number(row.data.id),
      name: String(row.data.name || 'Pet'),
      breed: String(row.data.breed || ''),
      type: String(row.data.type || 'Dog'),
      gender: String(row.data.gender || ''),
      age: String(row.data.age || ''),
      location: String(row.data.location || ''),
      image: String(row.data.image || ''),
      availability: row.data.availability !== false,
    }));
    return NextResponse.json({
      profile,
      plan: {
        active: activePlans.length > 0,
        profileLimit: activePlans.reduce((sum, plan) => sum + Number(plan.profileLimit || 15), 0),
        profilesUsed: activePlans.reduce((sum, plan) => sum + Number(plan.profilesUsed || 0), 0),
        expiresAt: activePlans.map(plan => String(plan.expiresAt)).sort().at(-1) || null,
      },
      listings: petListings,
      matchingProfiles,
      enquiries: inquiries,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return errorResponse('Could not load the breeder dashboard. Please retry.', 503);
  }
}

export async function PATCH(request: NextRequest) {
  if (!localEnabled()) return errorResponse('Breeder dashboard is unavailable.', 503);
  if (!validOrigin(request)) return errorResponse('Invalid request origin.', 403);
  const parsed = z.object({
    token: z.string().regex(/^[A-Za-z0-9_-]{40,60}$/),
    listingId: z.number().int().positive(),
    enquiryId: z.number().int().positive(),
    status: z.enum(['accepted', 'declined']),
  }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse('Choose a valid enquiry update.', 400);
  try {
    const ownerTokenHash = hashOwnerToken(parsed.data.token);
    const listing = await getRecordById<PetMarketListing>('pet_market_listings', parsed.data.listingId);
    if (!listing || listing.owner_token_hash !== ownerTokenHash) return errorResponse('Breeder listing not found.', 404);
    const enquiry = await getRecordById<PetMarketEnquiry>('pet_market_enquiries', parsed.data.enquiryId);
    if (!enquiry || enquiry.listing_id !== parsed.data.listingId) return errorResponse('Buyer enquiry not found.', 404);
    const updated = { ...enquiry.data, status: parsed.data.status };
    if (!await updateRecord(enquiry.row_id, updated, { listingId: parsed.data.listingId })) return errorResponse('The enquiry changed. Refresh and try again.', 409);
    await audit(`Breeder ${parsed.data.status} pet enquiry #${enquiry.data.id} for listing #${parsed.data.listingId}`);
    return NextResponse.json({ enquiry: updated }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return errorResponse('Could not update the buyer enquiry.', 503);
  }
}
