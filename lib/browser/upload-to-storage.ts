export type PetzoUploadKind='pet-image'|'seller-document'|'admin-image';
export type UploadedPrivateDocument={key:string;name:string;type:string;size:number};

function bytesToBase64(bytes:Uint8Array){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary)}

async function encryptSellerDocument(file:File,encodedKey:string){
 const keyBytes=Uint8Array.from(atob(encodedKey),character=>character.charCodeAt(0));
 const key=await crypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['encrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,await file.arrayBuffer());
 return new Blob([iv,encrypted],{type:'application/octet-stream'});
}

export async function uploadToPetzoStorage(file:File,kind:PetzoUploadKind):Promise<string|UploadedPrivateDocument>{
 const uploadLabel=kind==='seller-document'?'seller document':'photo';
 const r2BucketLabel=kind==='seller-document'?'private document bucket':'media bucket';
 const signature=bytesToBase64(new Uint8Array(await file.slice(0,16).arrayBuffer()));
 let ticketResponse:Response;
 try{ticketResponse=await fetch('/api/storage/upload-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,name:file.name,type:file.type,size:file.size,signature})})}catch{throw Error('Could not reach Petzo’s upload service. Check your connection and try again.')}
 let ticket:Record<string,any>;
 try{ticket=await ticketResponse.json()}catch{throw Error('Petzo could not prepare the upload. Refresh the page and try again.')}
 if(!ticketResponse.ok)throw Error(ticket.error||'Could not prepare a secure upload.');
 let uploadBody:Blob=file;
 if(ticket.provider==='r2'&&kind==='seller-document'){
  try{uploadBody=await encryptSellerDocument(file,ticket.encryptionKey)}catch{throw Error('Could not encrypt the seller document. Refresh the page and try again.')}
 }
 const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
 const uploadHeaders:Record<string,string>=ticket.provider==='r2'?{'Content-Type':uploadBody.type}:{apikey:publicKey,'Content-Type':file.type,'x-upsert':'false'};
 if(ticket.provider!=='r2'&&!publicKey.startsWith('sb_publishable_'))uploadHeaders.Authorization=`Bearer ${publicKey}`;
 let uploaded:Response;
 try{uploaded=await fetch(ticket.uploadUrl,{method:'PUT',mode:'cors',credentials:'omit',headers:uploadHeaders,body:uploadBody})}catch{if(ticket.provider==='r2'){const bucket=kind==='seller-document'?'petzo-private-documents':'petzo-media';const origin=typeof window!=='undefined'?window.location.origin:'this website';throw Error(`Cloudflare R2 blocked this upload from ${origin}. Add that exact origin and PUT + Content-Type to the ${bucket} CORS policy.`)}throw Error(`Could not reach secure storage to upload the ${uploadLabel}. Check your connection and try again.`)}
 if(!uploaded.ok){let detail='';if(ticket.provider==='r2'){try{const body=await uploaded.text();detail=body.match(/<Code>([^<]+)<\/Code>/i)?.[1]||''}catch{}}throw Error(ticket.provider==='r2'?`Cloudflare R2 rejected the ${uploadLabel} upload (HTTP ${uploaded.status}${detail?`, ${detail}`:''}). Check the name and write permissions for the ${r2BucketLabel}.`:`Could not save the ${uploadLabel} to secure storage (HTTP ${uploaded.status}). Please try again.`)}
 return kind==='seller-document'?{key:ticket.key,name:file.name.replace(/[\\/\u0000-\u001f]/g,'_').slice(0,150)||'seller-document',type:file.type,size:file.size}:ticket.publicUrl;
}
