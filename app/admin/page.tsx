import {isAdmin,localEnabled} from '../../lib/server/admin-auth';
import {allPets,allPlans,settings} from '../../lib/server/database';
import AdminPanel from '../../components/admin-panel';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata={title:'Petzo Admin',robots:{index:false,follow:false}};
export default async function AdminPage(){const enabled=localEnabled();const authenticated=enabled&&await isAdmin();return <AdminPanel authenticated={authenticated} enabled={enabled} initialPets={authenticated?allPets():[]} initialPlans={authenticated?allPlans():[]} initialSettings={authenticated?settings():null}/>}
