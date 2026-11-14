import {createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {NextRequest,NextResponse} from 'next/server';
import {db} from './database';
const cookieName='petzo_admin';
const lifetime=8*60*60;
export function localEnabled(){return process.env.LOCAL_ADMIN_ENABLED==='true'&&!!process.env.ADMIN_SESSION_SECRET&&!!process.env.ADMIN_PASSWORD_HASH}
export function localRequest(request:NextRequest){const hostname=new URL('http://'+(request.headers.get('host')||'invalid')).hostname;return ['localhost','127.0.0.1','[::1]'].includes(hostname)}
function sign(value:string){return createHmac('sha256',process.env.ADMIN_SESSION_SECRET||'disabled').update(value).digest('hex')}
export async function isAdmin(){if(!localEnabled())return false;const token=(await cookies()).get(cookieName)?.value;if(!token)return false;const [body,signature]=token.split('.');if(!body||!signature||!/^[a-f0-9]{64}$/.test(signature))return false;const expected=sign(body);if(!timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(expected,'hex')))return false;try{const payload=JSON.parse(Buffer.from(body,'base64url').toString());return payload.role==='admin'&&payload.exp>Date.now()&&!!db().prepare('SELECT nonce FROM admin_sessions WHERE nonce=? AND expires>?').get(payload.nonce,Date.now())}catch{return false}}
export function verifyPassword(email:string,password:string){const stored=process.env.ADMIN_PASSWORD_HASH||'';const [salt,hash]=stored.split(':');if(!salt||!hash||hash.length!==128)return false;const actual=scryptSync(password,salt,64);return email.toLowerCase()===(process.env.ADMIN_EMAIL||'').toLowerCase()&&timingSafeEqual(actual,Buffer.from(hash,'hex'))}
export function attachSession(response:NextResponse){const nonce=randomBytes(24).toString('hex');const exp=Date.now()+lifetime*1000;db().prepare('DELETE FROM admin_sessions WHERE expires<?').run(Date.now());db().prepare('INSERT INTO admin_sessions(nonce,expires) VALUES(?,?)').run(nonce,exp);const body=Buffer.from(JSON.stringify({role:'admin',exp,nonce})).toString('base64url');response.cookies.set(cookieName,`${body}.${sign(body)}`,{httpOnly:true,sameSite:'strict',path:'/',maxAge:lifetime,secure:false});return response}
export function clearSession(response:NextResponse){response.cookies.set(cookieName,'',{httpOnly:true,sameSite:'strict',path:'/',maxAge:0});return response}
export async function guard(request:NextRequest){if(!localEnabled()||!localRequest(request))return NextResponse.json({error:'Local administration is available only on this computer.'},{status:403});if(!await isAdmin())return NextResponse.json({error:'Admin login required.'},{status:401});if(request.method!=='GET'&&!validOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});return null}
export function validOrigin(request:NextRequest){return request.headers.get('origin')===new URL(request.url).protocol+'//'+request.headers.get('host')}
export async function revokeSession(){try{const token=(await cookies()).get(cookieName)?.value;const body=token?.split('.')[0];if(body){const payload=JSON.parse(Buffer.from(body,'base64url').toString());if(typeof payload.nonce==='string')db().prepare('DELETE FROM admin_sessions WHERE nonce=?').run(payload.nonce)}}catch{}}

