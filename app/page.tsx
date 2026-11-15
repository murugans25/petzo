import Marketplace from '../components/marketplace';
import {publicCatalog} from '../lib/server/database';
import {demoCatalog} from '../lib/server/demo-catalog';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export default async function Home({searchParams}:{searchParams:Promise<{view?:string;owner?:string}>}){const query=await searchParams;const view=['discover','adoption','marketplace','plans','how','safety','privacy','terms','contact','matches'].includes(query.view||'')?query.view:'home';let catalog;try{catalog=await publicCatalog()}catch{catalog=demoCatalog()}return <Marketplace initialCatalog={catalog} initialView={view} ownerToken={query.owner||''}/>}
