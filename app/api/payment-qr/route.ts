import {NextResponse} from 'next/server';
import {makeUpiQrSvg} from '../../../lib/server/upi-qr';
export const dynamic='force-dynamic';
export function GET(){return new NextResponse(makeUpiQrSvg(),{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}})}
