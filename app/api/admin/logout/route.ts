import {NextRequest,NextResponse} from 'next/server';
import {clearSession,validOrigin,revokeSession} from '../../../../lib/server/admin-auth';
export async function POST(request:NextRequest){if(!validOrigin(request))return NextResponse.json({error:'Invalid origin.'},{status:403});await revokeSession();return clearSession(NextResponse.json({ok:true}))}
