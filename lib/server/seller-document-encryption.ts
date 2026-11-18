import 'server-only';
import {createDecipheriv,createHmac} from 'node:crypto';

export const encryptedSellerDocumentKey=/^[a-f0-9-]{36}\.enc$/;

export function sellerDocumentEncryptionKey(key:string){
 const secret=process.env.SELLER_DOCUMENT_ENCRYPTION_SECRET||process.env.ADMIN_SESSION_SECRET;
 if(!secret)throw new Error('Seller document encryption is not configured.');
 return createHmac('sha256',secret).update('petzo-seller-document-v1:').update(key).digest();
}

export function decryptSellerDocument(key:string,bytes:Buffer){
 if(bytes.length<=28||bytes.length>10*1024*1024+28)return null;
 try{
  const decipher=createDecipheriv('aes-256-gcm',sellerDocumentEncryptionKey(key),bytes.subarray(0,12));
  decipher.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([decipher.update(bytes.subarray(12,-16)),decipher.final()]);
 }catch{return null}
}
