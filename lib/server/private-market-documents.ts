import {randomUUID} from 'node:crypto';
import {deleteObject,readObject,uploadObject} from './storage';
import {r2Bucket,r2Delete,r2Read} from './r2';
import {decryptSellerDocument,encryptedSellerDocumentKey} from './seller-document-encryption';
import type {PrivateMarketDocument} from '../pet-market-types';
export async function savePrivateMarketDocument(file:File):Promise<PrivateMarketDocument>{if(!file.size||file.size>10*1024*1024)throw Error('Private documents must be under 10 MB.');const bytes=Buffer.from(await file.arrayBuffer());let type='';if(file.type==='application/pdf'&&bytes.subarray(0,5).toString('ascii')==='%PDF-')type='application/pdf';if(file.type==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)type='image/jpeg';if(file.type==='image/png'&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))type='image/png';if(file.type==='image/webp'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')type='image/webp';if(!type)throw Error('Use a valid PDF, JPEG, PNG or WebP document.');const key=`${randomUUID()}.${type==='application/pdf'?'pdf':type==='image/jpeg'?'jpg':type==='image/png'?'png':'webp'}`;await uploadObject(r2Bucket(true),key,bytes,type);return {key,name:file.name.replace(/[\\/\u0000-\u001f]/g,'_').slice(0,150)||'seller-document',type,size:file.size}}
export async function readPrivateMarketDocument(key:string){
 if(encryptedSellerDocumentKey.test(key)){
  const bytes=await r2Read(r2Bucket(),key);
  return bytes&&decryptSellerDocument(key,bytes);
 }
 if(!/^[a-f0-9-]{36}\.(pdf|jpg|png|webp)$/.test(key))return null;
 return readObject(r2Bucket(true),key);
}

export async function removePrivateMarketDocument(document:PrivateMarketDocument|null){
 if(!document)return;
 if(encryptedSellerDocumentKey.test(document.key)){
  await r2Delete(r2Bucket(),document.key);
 }else if(/^[a-f0-9-]{36}\.(pdf|jpg|png|webp)$/.test(document.key)){
  await deleteObject(r2Bucket(true),document.key);
 }
}
