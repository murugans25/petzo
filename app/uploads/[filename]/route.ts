import {NextResponse} from 'next/server';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export const runtime='nodejs';
export async function GET(_:Request,{params}:{params:Promise<{filename:string}>}){const {filename}=await params;if(!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(filename))return new NextResponse(null,{status:404});try{const bytes=await readFile(path.join(process.cwd(),'.data','uploads',filename));const ext=filename.split('.').pop();return new NextResponse(bytes,{headers:{'Content-Type':ext==='jpg'?'image/jpeg':`image/${ext}`,'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=86400'}})}catch{return new NextResponse(null,{status:404})}}
