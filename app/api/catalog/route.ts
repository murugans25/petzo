import {NextResponse} from 'next/server';
import {publicCatalog} from '../../../lib/server/database';
import {demoCatalog} from '../../../lib/server/demo-catalog';
export const dynamic='force-dynamic';
export const runtime='nodejs';
function diagnostic(error:unknown){const message=error instanceof Error?error.message:'';const status=message.match(/Supabase request failed \((\d{3})\)/)?.[1];const code=message.match(/\b(PGRST\d{3}|42501|28P01|3F000|42P01)\b/)?.[1];return code?`${status||'DB'}_${code}`:status?`SUPABASE_HTTP_${status}`:'INTERNAL_ERROR'}
export async function GET(){try{return NextResponse.json(await publicCatalog(),{headers:{'Cache-Control':'no-store'}})}catch(error){const code=diagnostic(error);console.error('[petzo:catalog:GET]',code);return NextResponse.json({...demoCatalog(),preview:true,diagnostic:code},{headers:{'Cache-Control':'no-store'}})}}
