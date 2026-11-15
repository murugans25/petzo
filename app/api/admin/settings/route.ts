import {NextRequest,NextResponse} from 'next/server';
import {guard} from '../../../../lib/server/admin-auth';
import {settings,audit} from '../../../../lib/server/database';
import {listRecords,putRecord} from '../../../../lib/server/supabase-data';
import {settingsSchema} from '../../../../lib/server/validation';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){const blocked=await guard(request);if(blocked)return blocked;try{const [site,logs]=await Promise.all([settings(),listRecords<any>('audit')]);return NextResponse.json({settings:site,logs:logs.slice(-30).reverse().map(row=>row.data)},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Unable to load site settings.'},{status:500})}}
export async function PUT(request:NextRequest){const blocked=await guard(request);if(blocked)return blocked;try{const parsed=settingsSchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(i=>i.message).join('; ')},{status:400});await putRecord('settings','1',parsed.data as Record<string,unknown>);await audit('Updated public website settings');return NextResponse.json({settings:parsed.data})}catch{return NextResponse.json({error:'Unable to save settings.'},{status:500})}}
