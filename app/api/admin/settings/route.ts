import {NextRequest,NextResponse} from 'next/server';
import {guard} from '../../../../lib/server/admin-auth';
import {settings,db,audit} from '../../../../lib/server/database';
import {settingsSchema} from '../../../../lib/server/validation';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){const blocked=await guard(request);if(blocked)return blocked;return NextResponse.json({settings:settings(),logs:db().prepare('SELECT action,created_at FROM audit ORDER BY id DESC LIMIT 30').all()},{headers:{'Cache-Control':'no-store'}})}
export async function PUT(request:NextRequest){const blocked=await guard(request);if(blocked)return blocked;try{const parsed=settingsSchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(i=>i.message).join('; ')},{status:400});db().prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(parsed.data));audit('Updated public website settings');return NextResponse.json({settings:parsed.data})}catch{return NextResponse.json({error:'Unable to save settings.'},{status:500})}}
