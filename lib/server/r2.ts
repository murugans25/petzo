import 'server-only';
import {createHash,createHmac} from 'node:crypto';

const encode=(value:string)=>encodeURIComponent(value).replace(/[!'()*]/g,char=>`%${char.charCodeAt(0).toString(16).toUpperCase()}`);
const hmac=(key:Buffer|string,value:string)=>createHmac('sha256',key).update(value).digest();
const hex=(value:Buffer|string)=>Buffer.isBuffer(value)?value.toString('hex'):Buffer.from(value).toString('hex');

export function isR2Enabled(){return process.env.STORAGE_PROVIDER?.trim().toLowerCase()==='r2'}
export function r2Bucket(document=false){return document?(process.env.R2_PRIVATE_BUCKET||process.env.R2_PRIVATE_BUCKET_NAME||'petzo-private-documents'):(process.env.R2_BUCKET||process.env.R2_BUCKET_NAME||'petzo-media')}
function config(){
 const account=process.env.R2_ACCOUNT_ID?.trim();
 const accessKey=process.env.R2_ACCESS_KEY_ID?.trim();
 const secretKey=process.env.R2_SECRET_ACCESS_KEY?.trim();
 const endpoint=(process.env.R2_ENDPOINT?.trim()||(account?`https://${account}.r2.cloudflarestorage.com`:'' )).replace(/\/$/,'');
 const publicUrl=process.env.R2_PUBLIC_URL?.trim().replace(/\/$/,'');
 if(!account||!accessKey||!secretKey||!endpoint)throw new Error('Cloudflare R2 is not configured. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_ENDPOINT.');
 if(!/^https:\/\//i.test(endpoint))throw new Error('R2_ENDPOINT must use HTTPS.');
 return {account,accessKey,secretKey,endpoint:new URL(endpoint),publicUrl};
}
export function r2PublicMediaUrl(key:string){const {publicUrl}=config();if(!publicUrl)throw new Error('R2_PUBLIC_URL is not configured.');return `${publicUrl}/${key.split('/').map(encode).join('/')}`}

export function r2PresignedUrl(method:'GET'|'PUT'|'DELETE',bucket:string,key:string,expiresSeconds=300){
 const {accessKey,secretKey,endpoint}=config();
 const now=new Date();const amzDate=now.toISOString().replace(/[:-]|\.\d{3}/g,'');const date=amzDate.slice(0,8);const region=process.env.R2_REGION?.trim()||'auto';
 const scope=`${date}/${region}/s3/aws4_request`;const uri=`/${encode(bucket)}/${key.split('/').map(encode).join('/')}`;const host=endpoint.host;
 const pairs:[string,string][]=[['X-Amz-Algorithm','AWS4-HMAC-SHA256'],['X-Amz-Credential',`${accessKey}/${scope}`],['X-Amz-Date',amzDate],['X-Amz-Expires',String(expiresSeconds)],['X-Amz-SignedHeaders','host']];
 const canonicalQuery=pairs.map(([k,v])=>[encode(k),encode(v)] as const).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('&');
 const canonicalRequest=[method,uri,canonicalQuery,`host:${host}\n`,'host','UNSIGNED-PAYLOAD'].join('\n');
 const stringToSign=['AWS4-HMAC-SHA256',amzDate,scope,createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');
 const dateKey=hmac(`AWS4${secretKey}`,date);const regionKey=hmac(dateKey,region);const serviceKey=hmac(regionKey,'s3');const signingKey=hmac(serviceKey,'aws4_request');const signature=hex(hmac(signingKey,stringToSign));
 return `${endpoint.origin}${uri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export async function r2Put(bucket:string,key:string,bytes:Buffer,contentType:string){const url=r2PresignedUrl('PUT',bucket,key);const body=new Uint8Array(bytes);const response=await fetch(url,{method:'PUT',headers:{'Content-Type':contentType},body});if(!response.ok)throw new Error(`Cloudflare R2 upload failed (${response.status}).`)}
export async function r2Delete(bucket:string,key:string){const response=await fetch(r2PresignedUrl('DELETE',bucket,key),{method:'DELETE'});if(!response.ok&&response.status!==404)throw new Error(`Cloudflare R2 delete failed (${response.status}).`)}
export async function r2Read(bucket:string,key:string){const response=await fetch(r2PresignedUrl('GET',bucket,key),{cache:'no-store'});if(!response.ok)return null;return Buffer.from(await response.arrayBuffer())}
