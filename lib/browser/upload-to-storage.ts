export type PetzoUploadKind='pet-image'|'seller-document'|'admin-image';
export type UploadedPrivateDocument={key:string;name:string;type:string;size:number};

function bytesToBase64(bytes:Uint8Array){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary)}

export async function uploadToPetzoStorage(file:File,kind:PetzoUploadKind):Promise<string|UploadedPrivateDocument>{
 const signature=bytesToBase64(new Uint8Array(await file.slice(0,16).arrayBuffer()));
 const ticketResponse=await fetch('/api/storage/upload-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,name:file.name,type:file.type,size:file.size,signature})});
 const ticket=await ticketResponse.json();if(!ticketResponse.ok)throw Error(ticket.error||'Could not prepare a secure upload.');
 const uploaded=await fetch(ticket.uploadUrl,{method:'PUT',headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'',Authorization:`Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||''}`,'Content-Type':file.type,'x-upsert':'false'},body:file});
 if(!uploaded.ok)throw Error('Could not save the file to secure storage. Please try again.');
 return kind==='seller-document'?{key:ticket.key,name:file.name.replace(/[\\/\u0000-\u001f]/g,'_').slice(0,150)||'seller-document',type:file.type,size:file.size}:ticket.publicUrl;
}
