import 'server-only';
import {AwsClient} from 'aws4fetch';

const encode=(value:string)=>encodeURIComponent(value).replace(/[!'()*]/g,char=>`%${char.charCodeAt(0).toString(16).toUpperCase()}`);

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
 return {accessKey,secretKey,endpoint:new URL(endpoint),publicUrl};
}
export function r2PublicMediaUrl(key:string){const {publicUrl}=config();if(!publicUrl)throw new Error('R2_PUBLIC_URL is not configured.');return `${publicUrl}/${key.split('/').map(encode).join('/')}`}

export async function r2PresignedUrl(method:'GET'|'PUT'|'DELETE',bucket:string,key:string,expiresSeconds=300,contentType?:string){
 const {accessKey,secretKey,endpoint}=config();
 const path=`/${encode(bucket)}/${key.split('/').map(encode).join('/')}`;
 const url=new URL(`${endpoint.origin}${path}`);
 url.searchParams.set('X-Amz-Expires',String(expiresSeconds));
 const headers=contentType?{'Content-Type':contentType}:undefined;
 const request=new Request(url,{method,...(headers?{headers}:{})});
 const client=new AwsClient({accessKeyId:accessKey,secretAccessKey:secretKey,service:'s3',region:'auto'});
 const signed=await client.sign(request,{aws:{signQuery:true,...(contentType?{allHeaders:true}:{})}});
 return signed.url.toString();
}

export async function r2Put(bucket:string,key:string,bytes:Buffer,contentType:string){const url=await r2PresignedUrl('PUT',bucket,key,300,contentType);const body=new Uint8Array(bytes);const response=await fetch(url,{method:'PUT',headers:{'Content-Type':contentType},body});if(!response.ok)throw new Error(`Cloudflare R2 upload failed (${response.status}).`)}
export async function r2Delete(bucket:string,key:string){const url=await r2PresignedUrl('DELETE',bucket,key);const response=await fetch(url,{method:'DELETE'});if(!response.ok&&response.status!==404)throw new Error(`Cloudflare R2 delete failed (${response.status}).`)}
export async function r2Read(bucket:string,key:string){const url=await r2PresignedUrl('GET',bucket,key);const response=await fetch(url,{cache:'no-store'});if(!response.ok)return null;return Buffer.from(await response.arrayBuffer())}
