import Marketplace from '../../components/marketplace';
import {publicCatalog} from '../../lib/server/database';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata={title:'Your Favourites | Petzo',robots:{index:false,follow:false}};
export default async function Favourites(){try{return <Marketplace initialCatalog={await publicCatalog()} initialView="saved"/>}catch{return <main style={{padding:40}}><h1>Favourites are unavailable.</h1><p>Check the Supabase configuration.</p><a href="/">Back to Petzo</a></main>}}
