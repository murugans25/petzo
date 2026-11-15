import Marketplace from '../components/marketplace';
import {publicCatalog} from '../lib/server/database';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export default async function Home({searchParams}:{searchParams:Promise<{view?:string;owner?:string}>}){const query=await searchParams;const view=['discover','adoption','marketplace','plans','how','safety','privacy','terms','contact','matches'].includes(query.view||'')?query.view:'home';try{return <Marketplace initialCatalog={await publicCatalog()} initialView={view} ownerToken={query.owner||''}/>}catch{return <main style={{padding:50,maxWidth:700,margin:'auto'}}><h1>Petzo is getting ready.</h1><p>Supabase is not configured or the Petzo records have not been migrated yet.</p><a href="/admin">Open administration</a></main>}}
