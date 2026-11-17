import {NextResponse} from 'next/server';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeUpiQrSvg} from '../../../lib/server/upi-qr';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(){try{const image=await readFile(join(process.cwd(),'public','payment-qr.png'));return new NextResponse(new Uint8Array(image),{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}})}catch{return new NextResponse(makeUpiQrSvg(),{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}})}}
