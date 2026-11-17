import {NextResponse} from 'next/server';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeUpiQrSvg} from '../../../lib/server/upi-qr';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(){for(const [filename,type] of [['payment-qr.png','image/png'],['payment-qr.jpg','image/jpeg'],['payment-qr.png.jpg','image/jpeg']] as const){try{const image=await readFile(join(process.cwd(),'public',filename));return new NextResponse(new Uint8Array(image),{headers:{'Content-Type':type,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}})}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error}}return new NextResponse(makeUpiQrSvg(),{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}})}
