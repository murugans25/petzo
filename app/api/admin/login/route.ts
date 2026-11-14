import {NextRequest,NextResponse} from 'next/server';
import {attachSession,localEnabled,localRequest,validOrigin,verifyPassword} from '../../../../lib/server/admin-auth';
import {db,audit} from '../../../../lib/server/database';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 if(!localEnabled()||!localRequest(request))return NextResponse.json({error:'Local admin is not configured or this is not a local request.'},{status:403});
 if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 try{const body=await request.json();if(typeof body.email!=='string'||typeof body.password!=='string'||body.password.length>256)return NextResponse.json({error:'Invalid email or password.'},{status:400});
 const database=db();let rate=database.prepare('SELECT attempts,started FROM login_attempts WHERE id=1').get();if(!rate||Date.now()-Number(rate.started)>600000){database.prepare('INSERT OR REPLACE INTO login_attempts(id,attempts,started) VALUES(1,0,?)').run(Date.now());rate={attempts:0,started:Date.now()}}
 if(Number(rate.attempts)>=8)return NextResponse.json({error:'Too many attempts. Try again in ten minutes.'},{status:429});
 if(!verifyPassword(body.email,body.password)){database.prepare('UPDATE login_attempts SET attempts=attempts+1 WHERE id=1').run();return NextResponse.json({error:'Invalid email or password.'},{status:401})}
 database.prepare('DELETE FROM login_attempts WHERE id=1').run();audit('Admin signed in');return attachSession(NextResponse.json({ok:true}));
 }catch{return NextResponse.json({error:'Unable to sign in. Check local configuration.'},{status:500})}
}
