import {createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {NextRequest,NextResponse} from 'next/server';
import {deleteRecord,getRecord,putRecord} from './supabase-data';
const cookieName='petzo_admin';
const lifetime=8*60*60;
export function localEnabled(){return !!process.env.ADMIN_SESSION_SECRET&&!!process.env.ADMIN_PASSWORD_HASH&&!!process.env.ADMIN_EMAIL}
// Kept as a compatibility helper for older routes; origin validation is the actual request guard.
export function localRequest(_request:NextRequest){return true}
function sign(value:string){return createHmac('sha256',process.env.ADMIN_SESSION_SECRET||'disabled').update(value).digest('hex')}
export async function isAdmin(){if(!localEnabled())return false;const token=(await cookies()).get(cookieName)?.value;if(!token)return false;const [body,signature]=token.split('.');if(!body||!signature||!/^[a-f0-9]{64}$/.test(signature))return false;const expected=sign(body);if(!timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(expected,'hex')))return false;try{const payload=JSON.parse(Buffer.from(body,'base64url').toString());const session=await getRecord<{nonce:string;expires:number}>('admin_sessions',payload.nonce);return payload.role==='admin'&&payload.exp>Date.now()&&session?.data.expires>Date.now()}catch{return false}}
export function verifyPassword(email:string,password:string){const stored=process.env.ADMIN_PASSWORD_HASH||'';const [salt,hash]=stored.split(':');if(!salt||!hash||hash.length!==128)return false;const actual=scryptSync(password,salt,64);return email.toLowerCase()===(process.env.ADMIN_EMAIL||'').toLowerCase()&&timingSafeEqual(actual,Buffer.from(hash,'hex'))}
export async function attachSession(response:NextResponse){const nonce=randomBytes(24).toString('hex');const exp=Date.now()+lifetime*1000;await putRecord('admin_sessions',nonce,{nonce,expires:exp});const body=Buffer.from(JSON.stringify({role:'admin',exp,nonce})).toString('base64url');response.cookies.set(cookieName,`${body}.${sign(body)}`,{httpOnly:true,sameSite:'strict',path:'/',maxAge:lifetime,secure:process.env.NODE_ENV==='production'});return response}
export function clearSession(response:NextResponse){response.cookies.set(cookieName,'',{httpOnly:true,sameSite:'strict',path:'/',maxAge:0,secure:process.env.NODE_ENV==='production'});return response}
export async function guard(request:NextRequest){if(!localEnabled())return NextResponse.json({error:'Admin is not configured.'},{status:503});if(!await isAdmin())return NextResponse.json({error:'Admin login required.'},{status:401});if(request.method!=='GET'&&!validOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});return null}
export function validOrigin(request:NextRequest){return request.headers.get('origin')===new URL(request.url).protocol+'//'+request.headers.get('host')}
export async function revokeSession(){try{const token=(await cookies()).get(cookieName)?.value;const body=token?.split('.')[0];if(body){const payload=JSON.parse(Buffer.from(body,'base64url').toString());if(typeof payload.nonce==='string'){const row=await getRecord('admin_sessions',payload.nonce);if(row)await deleteRecord('admin_sessions',row.row_id)}}}catch{}}
