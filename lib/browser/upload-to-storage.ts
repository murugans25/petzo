export type PetzoUploadKind='pet-image'|'seller-document'|'admin-image';
export type UploadedPrivateDocument={key:string;name:string;type:string;size:number};

function bytesToBase64(bytes:Uint8Array){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary)}

export async function uploadToPetzoStorage(file:File,kind:PetzoUploadKind):Promise<string|UploadedPrivateDocument>{
 const signature=bytesToBase64(new Uint8Array(await file.slice(0,16).arrayBuffer()));
 let ticketResponse:Response;
 try{ticketResponse=await fetch('/api/storage/upload-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,name:file.name,type:file.type,size:file.size,signature})})}catch{throw Error('Could not reach Petzo’s upload service. Check your connection and try again.')}
 let ticket:Record<string,any>;
 try{ticket=await ticketResponse.json()}catch{throw Error('Petzo could not prepare the upload. Refresh the page and try again.')}
 if(!ticketResponse.ok)throw Error(ticket.error||'Could not prepare a secure upload.');
 const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
 const uploadHeaders:Record<string,string>=ticket.provider==='r2'?{'Content-Type':file.type}:{apikey:publicKey,'Content-Type':file.type,'x-upsert':'false'};
 if(ticket.provider!=='r2'&&!publicKey.startsWith('sb_publishable_'))uploadHeaders.Authorization=`Bearer ${publicKey}`;
 let uploaded:Response;
 try{uploaded=await fetch(ticket.uploadUrl,{method:'PUT',mode:'cors',credentials:'omit',headers:uploadHeaders,body:file})}catch{throw Error(ticket.provider==='r2'?'Could not reach Cloudflare R2 to upload the photo. Check the bucket CORS settings and try again.':'Could not reach secure photo storage. Check your connection and try again.')}
 if(!uploaded.ok){let detail='';if(ticket.provider==='r2'){try{const body=await uploaded.text();detail=body.match(/<Code>([^<]+)<\/Code>/i)?.[1]||''}catch{}}throw Error(ticket.provider==='r2'?`Cloudflare R2 rejected the upload (HTTP ${uploaded.status}${detail?`, ${detail}`:''}). Check the R2 key permissions and bucket name.`:`Could not save the file to secure storage (HTTP ${uploaded.status}). Please try again.`)}
 return kind==='seller-document'?{key:ticket.key,name:file.name.replace(/[\\/\u0000-\u001f]/g,'_').slice(0,150)||'seller-document',type:file.type,size:file.size}:ticket.publicUrl;
}
