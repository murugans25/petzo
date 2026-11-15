import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {guard,localEnabled,validOrigin} from '../../../../lib/server/admin-auth';

export const runtime='nodejs';export const dynamic='force-dynamic';
const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
function signatureMatches(type:string,bytes:Buffer){if(type==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;if(type==='image/png')return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));if(type==='image/webp')return bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(type==='application/pdf')return bytes.subarray(0,5).toString('ascii')==='%PDF-';return false}
export async function POST(request:NextRequest){
 if(!localEnabled()||!validOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 try{
  const body=await request.json() as {kind?:string;name?:string;type?:string;size?:number;signature?:string};
  const admin=body.kind==='admin-image';if(admin){const blocked=await guard(request);if(blocked)return blocked;}
  const document=body.kind==='seller-document';if(!admin&&!document&&body.kind!=='pet-image')return NextResponse.json({error:'Invalid upload type.'},{status:400});
  const type=body.type||'',extension=extensions[type],size=Number(body.size),max=document?10*1024*1024:5*1024*1024;
  if(!extension||!Number.isSafeInteger(size)||size<1||size>max||(!document&&type==='application/pdf'))return NextResponse.json({error:document?'Choose a PDF, JPEG, PNG or WebP document under 10 MB.':'Choose a JPEG, PNG or WebP image under 5 MB.'},{status:400});
  const bytes=Buffer.from(body.signature||'','base64');if(!signatureMatches(type,bytes))return NextResponse.json({error:'The selected file does not match its file type.'},{status:400});
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'');const secret=process.env.SUPABASE_SECRET_KEY;if(!base||!secret)return NextResponse.json({error:'Supabase Storage is not configured.'},{status:503});
  const bucket=document?'petzo-private-documents':'petzo-media';const key=document?`${randomUUID()}.${extension}`:`pets/${randomUUID()}.${extension}`;const encoded=key.split('/').map(encodeURIComponent).join('/');
  const response=await fetch(`${base}/storage/v1/object/upload/sign/${bucket}/${encoded}`,{method:'POST',headers:{apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({upsert:false})});
  const result=await response.json();if(!response.ok)throw Error(`Could not create secure upload ticket (${response.status}).`);
  const signed=String(result.signedURL||result.url||'');if(!signed)throw Error('Storage did not return an upload ticket.');
  const uploadUrl=signed.startsWith('http')?signed:`${base}/storage/v1${signed.startsWith('/')?signed:`/${signed}`}`;
  const publicUrl=document?undefined:`${base}/storage/v1/object/public/${bucket}/${encoded}`;
  return NextResponse.json({uploadUrl,publicUrl,key:document?key:undefined},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Could not prepare the upload.'},{status:400})}
}
