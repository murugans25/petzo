import {NextRequest,NextResponse} from 'next/server';
import {randomBytes} from 'node:crypto';
import {getRecord,putRecord} from './supabase-data';
import {defaultPreferences,DiscoveryPreferences} from '../discovery';
export async function workspace(request:NextRequest){const existing=request.cookies.get('petzo_discovery')?.value;const id=existing&&/^[a-f0-9]{64}$/.test(existing)?existing:randomBytes(32).toString('hex');let row=await getRecord<{preferences:DiscoveryPreferences;decisions:Record<number,string>}>('discovery_workspaces',id);if(!row)row=await putRecord('discovery_workspaces',id,{preferences:defaultPreferences,decisions:{}});return {id,row:row.data}}
export function workspaceResponse(id:string,body:unknown,status=200){const res=NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});res.cookies.set('petzo_discovery',id,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*365});return res}
export async function saveWorkspacePreferences(request:NextRequest,prefs:DiscoveryPreferences){const {id,row}=await workspace(request);await putRecord('discovery_workspaces',id,{...row,preferences:prefs});return id}
