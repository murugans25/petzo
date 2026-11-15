import {DatabaseSync} from 'node:sqlite';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SECRET_KEY;
if(!url||!key)throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.');
const file='.data/petzo.sqlite';
if(!existsSync(file))throw new Error('Local Petzo database was not found.');
const sqlite=new DatabaseSync(file,{readOnly:true});
const endpoint=url.replace(/\/$/,'')+'/rest/v1/petzo_app_records';
const storage=url.replace(/\/$/,'')+'/storage/v1/object';
const tableNames=new Set(sqlite.prepare("select name from sqlite_master where type='table'").all().map(row=>row.name));
const has=name=>tableNames.has(name);
const select=(table,columns)=>has(table)?sqlite.prepare(`select ${columns} from ${table}`).all():[];
const migrations=[];
for(const row of select('pets','id,data'))migrations.push({collection:'pets',record_key:String(row.id),data:{...JSON.parse(row.data),id:Number(row.id)}});
for(const row of select('plans','id,data'))migrations.push({collection:'plans',record_key:String(row.id),data:{...JSON.parse(row.data),id:Number(row.id)}});
for(const row of select('settings','id,data'))migrations.push({collection:'settings',record_key:String(row.id),data:JSON.parse(row.data)});
for(const row of select('adoption_listings','id,data,owner_token_hash'))migrations.push({collection:'adoption_listings',record_key:String(row.id),data:{...JSON.parse(row.data),id:Number(row.id)},owner_token_hash:row.owner_token_hash});
for(const row of select('adoption_requests','id,listing_id,data'))migrations.push({collection:'adoption_requests',record_key:String(row.id),listing_id:Number(row.listing_id),data:{...JSON.parse(row.data),id:Number(row.id)}});
for(const row of select('pet_market_listings','id,data,owner_token_hash'))migrations.push({collection:'pet_market_listings',record_key:String(row.id),data:{...JSON.parse(row.data),id:Number(row.id)},owner_token_hash:row.owner_token_hash});
for(const row of select('pet_market_enquiries','id,listing_id,data'))migrations.push({collection:'pet_market_enquiries',record_key:String(row.id),listing_id:Number(row.listing_id),data:{...JSON.parse(row.data),id:Number(row.id)}});
for(const row of select('audit','id,action,created_at'))migrations.push({collection:'audit',record_key:String(row.id),data:{action:row.action,created_at:row.created_at},created_at:row.created_at});
for(const row of select('discovery_workspaces','id,preferences,decisions,updated_at'))migrations.push({collection:'discovery_workspaces',record_key:row.id,data:{preferences:JSON.parse(row.preferences),decisions:JSON.parse(row.decisions),updatedAt:row.updated_at},updated_at:row.updated_at});
for(const row of select('browser_favourites','workspace_id,pet_id,created_at'))migrations.push({collection:'browser_favourites',record_key:`${row.workspace_id}:${row.pet_id}`,workspace_id:row.workspace_id,data:{petId:Number(row.pet_id),createdAt:row.created_at},created_at:row.created_at});
let migratedAssets=0;const assetUpdates=[];
async function uploadLegacy(bucket,objectPath,bytes,type){const response=await fetch(`${storage}/${bucket}/${objectPath.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':type,'x-upsert':'true'},body:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});if(!response.ok)throw new Error(`Legacy asset upload failed (${response.status}).`)}
async function migrateMediaValue(value){if(typeof value!=='string'||!/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(value))return value;const name=path.basename(value);let bytes;for(const source of [path.join('public','uploads',name),path.join('.data','uploads',name)]){if(existsSync(source)){bytes=await readFile(source);break}}if(!bytes)throw new Error(`Referenced local image is missing: ${name}`);const ext=name.split('.').pop();const type=ext==='jpg'?'image/jpeg':`image/${ext}`;const objectPath=`pets/${name}`;await uploadLegacy('petzo-media',objectPath,bytes,type);migratedAssets++;return `${url.replace(/\/$/,'')}/storage/v1/object/public/petzo-media/${objectPath}`}
async function rewriteAssets(value){if(typeof value==='string')return migrateMediaValue(value);if(Array.isArray(value))return Promise.all(value.map(rewriteAssets));if(value&&typeof value==='object'){const output={};for(const [key,item] of Object.entries(value)){if((key==='registrationDocument'||key==='vetDocument')&&item&&typeof item==='object'&&typeof item.key==='string'&&/^[a-f0-9-]{36}\.(pdf|jpg|png|webp)$/.test(item.key)){const source=path.join('.data','private-market-documents',item.key);if(existsSync(source)){const bytes=await readFile(source);const type=item.type||'application/pdf';await uploadLegacy('petzo-private-documents',item.key,bytes,type);migratedAssets++}}const rewrittenKey=await migrateMediaValue(key);output[rewrittenKey]=await rewriteAssets(item)}return output}return value}
for(const row of migrations){const before=JSON.stringify(row.data);row.data=await rewriteAssets(row.data);if(JSON.stringify(row.data)!==before)assetUpdates.push(row)}
const now=new Date().toISOString();
for(let i=0;i<migrations.length;i+=100){
 const rows=migrations.slice(i,i+100).map(row=>({collection:row.collection,record_key:row.record_key,data:row.data,owner_token_hash:row.owner_token_hash??null,listing_id:row.listing_id??null,workspace_id:row.workspace_id??null,created_at:row.created_at??now,updated_at:row.updated_at??now}));
 const response=await fetch(`${endpoint}?on_conflict=collection,record_key`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(rows)});
 if(!response.ok){const body=await response.text();throw new Error(`Supabase import failed for batch ${Math.floor(i/100)+1} (${response.status}): ${body}`)}
}
for(const row of assetUpdates){const q=new URLSearchParams({collection:`eq.${row.collection}`,record_key:`eq.${row.record_key}`});const response=await fetch(`${endpoint}?${q}`,{method:'PATCH',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({data:row.data})});if(!response.ok)throw new Error(`Could not update a migrated asset reference (${response.status}).`)}
const summary={total:migrations.length,collections:Object.fromEntries([...new Set(migrations.map(x=>x.collection))].map(collection=>[collection,migrations.filter(row=>row.collection===collection).length]))};
console.log(JSON.stringify({ok:true,migratedAssets,...summary}));
sqlite.close();
